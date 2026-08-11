const starDisk=document.getElementById("starDisk");
const planisphere=document.getElementById("planisphere");
const dateInput=document.getElementById("dateInput");
const timeRange=document.getElementById("timeRange");
const timeText=document.getElementById("timeText");
const dateText=document.getElementById("dateText");
const nowBtn=document.getElementById("nowBtn");
const fullscreenBtn=document.getElementById("fullscreenBtn");
const playBtn=document.getElementById("playBtn");
const playIcon=document.getElementById("playIcon");
const playText=document.getElementById("playText");
const resetBtn=document.getElementById("resetBtn");
const speedSelect=document.getElementById("speedSelect");
const enhanceToggle=document.getElementById("enhanceToggle");
const gridToggle=document.getElementById("gridToggle");
const labelsToggle=document.getElementById("labelsToggle");
const altitudeGrid=document.getElementById("altitudeGrid");
const quick=[...document.querySelectorAll("[data-time]")];

let manualRotation=0,isPlaying=false,timer=null,dragging=false,lastAngle=0;

function pad(n){return String(n).padStart(2,"0")}
function setNow(){
  const n=new Date();
  dateInput.value=`${n.getFullYear()}-${pad(n.getMonth()+1)}-${pad(n.getDate())}`;
  timeRange.value=n.getHours()*60+n.getMinutes();
  manualRotation=0;update()
}
function dayOfYear(d){
  const start=new Date(d.getFullYear(),0,0);
  return Math.floor((d-start)/86400000)
}
function rotationForDateTime(){
  const d=new Date(`${dateInput.value}T12:00:00`);
  const day=dayOfYear(d);
  const minutes=Number(timeRange.value);
  return ((day-80)/365.2422)*360 + (minutes/1440)*360 + 180 + manualRotation;
}
function update(){
  const total=Number(timeRange.value);
  timeText.textContent=`${pad(Math.floor(total/60))}:${pad(total%60)}`;
  const d=new Date(`${dateInput.value}T12:00:00`);
  dateText.textContent=new Intl.DateTimeFormat("zh-TW",{month:"long",day:"numeric",weekday:"short"}).format(d);
  quick.forEach(b=>b.classList.toggle("active",Number(b.dataset.time)===total));
  starDisk.style.transform=`rotate(${rotationForDateTime()}deg)`;
}
function advance(){
  let v=Number(timeRange.value)+Number(speedSelect.value);
  if(v>=1440){
    v-=1440;
    const d=new Date(`${dateInput.value}T12:00:00`);d.setDate(d.getDate()+1);
    dateInput.value=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  timeRange.value=v;update()
}
function togglePlay(){
  isPlaying=!isPlaying;
  playIcon.textContent=isPlaying?"Ⅱ":"▶";
  playText.textContent=isPlaying?"暫停星空運轉":"播放星空運轉";
  clearInterval(timer);
  if(isPlaying)timer=setInterval(advance,1000)
}
function stop(){isPlaying=false;clearInterval(timer);timer=null;playIcon.textContent="▶";playText.textContent="播放星空運轉"}
function reset(){stop();setNow();enhanceToggle.checked=true;gridToggle.checked=false;labelsToggle.checked=true;applyToggles()}
function applyToggles(){
  starDisk.classList.toggle("soft",!enhanceToggle.checked);
  altitudeGrid.hidden=!gridToggle.checked;
  planisphere.classList.toggle("hide-cover-labels",!labelsToggle.checked)
}
function pointerAngle(e){
  const r=planisphere.getBoundingClientRect();
  return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI
}
planisphere.addEventListener("pointerdown",e=>{dragging=true;lastAngle=pointerAngle(e);planisphere.setPointerCapture(e.pointerId)});
planisphere.addEventListener("pointermove",e=>{
  if(!dragging)return;
  const a=pointerAngle(e);let delta=a-lastAngle;
  if(delta>180)delta-=360;if(delta<-180)delta+=360;
  manualRotation+=delta;lastAngle=a;update()
});
planisphere.addEventListener("pointerup",()=>dragging=false);
planisphere.addEventListener("pointercancel",()=>dragging=false);
dateInput.addEventListener("change",()=>{manualRotation=0;update()});
timeRange.addEventListener("input",()=>{manualRotation=0;update()});
quick.forEach(b=>b.addEventListener("click",()=>{timeRange.value=b.dataset.time;manualRotation=0;update()}));
playBtn.addEventListener("click",togglePlay);
resetBtn.addEventListener("click",reset);
nowBtn.addEventListener("click",setNow);
[enhanceToggle,gridToggle,labelsToggle].forEach(el=>el.addEventListener("change",applyToggles));
fullscreenBtn.addEventListener("click",async()=>{
  if(!document.fullscreenElement){await document.documentElement.requestFullscreen();fullscreenBtn.textContent="離開全螢幕"}
  else{await document.exitFullscreen();fullscreenBtn.textContent="全螢幕"}
});
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement)fullscreenBtn.textContent="全螢幕"});
setNow();applyToggles();
