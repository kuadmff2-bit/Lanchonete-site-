const $ = (selector) => document.querySelector(selector);
const form = $("#promoForm");
const passwordInput = $("#adminPassword");
const titleInput = $("#promoTitle");
const descriptionInput = $("#promoDescription");
const imageInput = $("#promoImage");
const activeInput = $("#promoActive");
const preview = $("#preview");
const previewImage = $("#previewImage");
const previewTitle = $("#previewTitle");
const previewDescription = $("#previewDescription");
const saveButton = $("#saveButton");
const hideButton = $("#hideButton");
const statusEl = $("#status");
let currentImage = "";
function setStatus(message,type=""){statusEl.textContent=message;statusEl.className=`status ${type}`.trim()}
function updatePreview(){const title=titleInput.value.trim();const description=descriptionInput.value.trim();if(!currentImage&&!title&&!description){preview.hidden=true;return}preview.hidden=false;previewImage.hidden=!currentImage;if(currentImage)previewImage.src=currentImage;previewTitle.textContent=title||"Promoção";previewDescription.textContent=description}
async function compressImage(file){const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error("Não foi possível ler a imagem."));reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file)});const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error("Imagem inválida."));img.src=dataUrl});const maxSide=1100;const scale=Math.min(1,maxSide/Math.max(image.width,image.height));const width=Math.max(1,Math.round(image.width*scale));const height=Math.max(1,Math.round(image.height*scale));const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;canvas.getContext("2d").drawImage(image,0,0,width,height);return canvas.toDataURL("image/jpeg",.74)}
async function loadCurrentPromotion(){try{const response=await fetch("/api/promo",{cache:"no-store"});if(!response.ok)return;const promo=await response.json();titleInput.value=promo.title||"";descriptionInput.value=promo.description||"";activeInput.checked=promo.active!==false;currentImage=promo.image||"";updatePreview()}catch{}}
imageInput.addEventListener("change",async()=>{const file=imageInput.files?.[0];if(!file)return;setStatus("Preparando imagem...");imageInput.disabled=true;try{currentImage=await compressImage(file);updatePreview();setStatus("Imagem pronta.","ok")}catch(error){setStatus(error.message||"Não foi possível preparar a imagem.","error")}finally{imageInput.disabled=false}});
titleInput.addEventListener("input",updatePreview);descriptionInput.addEventListener("input",updatePreview);
async function savePromotion(activeOverride=null){const password=passwordInput.value;const title=titleInput.value.trim();const description=descriptionInput.value.trim();const active=activeOverride===null?activeInput.checked:activeOverride;if(!password){setStatus("Digite a senha de administrador.","error");passwordInput.focus();return}if(active&&!title){setStatus("Digite o título da promoção.","error");titleInput.focus();return}saveButton.disabled=true;hideButton.disabled=true;setStatus("Salvando...");try{const response=await fetch("/api/promo",{method:"POST",headers:{"content-type":"application/json","x-admin-password":password},body:JSON.stringify({active,title,description,image:currentImage})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Não foi possível salvar.");activeInput.checked=active;setStatus(active?"Promoção publicada com sucesso.":"Promoção ocultada.","ok")}catch(error){setStatus(error.message==="Failed to fetch"?"O backend ainda não está configurado no Cloudflare.":error.message,"error")}finally{saveButton.disabled=false;hideButton.disabled=false}}
form.addEventListener("submit",event=>{event.preventDefault();savePromotion()});hideButton.addEventListener("click",()=>savePromotion(false));loadCurrentPromotion();
