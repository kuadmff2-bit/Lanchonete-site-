const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});

const DEFAULTS={
  enabled:false,
  greeting:"Olá! 👋 Sou o atendimento automático da lanchonete. Como posso ajudar?",
  fallback:"Não consegui entender sua mensagem. Digite menu para ver as opções ou aguarde um atendente.",
  humanHandoff:true,
  businessHoursOnly:false,
  openTime:"18:00",
  closeTime:"23:59",
  menuText:"1 - Ver cardápio\n2 - Fazer pedido\n3 - Acompanhar pedido\n4 - Falar com atendente",
  updatedAt:null
};

const clamp=(value,max)=>String(value??"").trim().slice(0,max);
const time=(value,fallback)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value||""))?String(value):fallback;

export async function onRequestGet({env}){
  if(!env.PROMOTIONS)return json({...DEFAULTS,storageConfigured:false});
  const raw=await env.PROMOTIONS.get("robot-settings");
  if(!raw)return json({...DEFAULTS,storageConfigured:true});
  try{return json({...DEFAULTS,...JSON.parse(raw),storageConfigured:true})}
  catch{return json({...DEFAULTS,storageConfigured:true})}
}

export async function onRequestPost({request,env}){
  if(!env.PROMOTIONS)return json({error:"KV PROMOTIONS não configurado."},500);
  if(!env.ADMIN_PASSWORD)return json({error:"Senha de administrador não configurada."},500);
  const password=request.headers.get("x-admin-password")||"";
  if(password!==env.ADMIN_PASSWORD)return json({error:"Senha incorreta."},401);

  let data;
  try{data=await request.json()}catch{return json({error:"Dados inválidos."},400)}

  const settings={
    enabled:Boolean(data.enabled),
    greeting:clamp(data.greeting,500)||DEFAULTS.greeting,
    fallback:clamp(data.fallback,500)||DEFAULTS.fallback,
    humanHandoff:data.humanHandoff!==false,
    businessHoursOnly:Boolean(data.businessHoursOnly),
    openTime:time(data.openTime,DEFAULTS.openTime),
    closeTime:time(data.closeTime,DEFAULTS.closeTime),
    menuText:clamp(data.menuText,1200)||DEFAULTS.menuText,
    updatedAt:new Date().toISOString()
  };

  await env.PROMOTIONS.put("robot-settings",JSON.stringify(settings));
  return json({ok:true,settings});
}
