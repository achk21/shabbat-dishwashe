import { hc } from "../../lib/homeconnect.js";
export default async function handler(req,res){
 if(req.method!=="GET") return res.status(405).json({ok:false,error:"Method not allowed"});
 try{
  const all=await hc("/homeappliances");
  const appliances=all?.data?.homeappliances||[];
  const d=appliances.find(x=>String(x.type).toLowerCase()==="dishwasher");
  if(!d) return res.status(404).json({ok:false,error:"Dishwasher not found"});
  const id=encodeURIComponent(d.haId);
  const [s,p]=await Promise.all([hc(`/homeappliances/${id}/status`),hc(`/homeappliances/${id}/programs/available`)]);
  const list=s?.data?.status||[];
  const value=(key)=>list.find(x=>x.key===key)?.value;
  res.status(200).json({
   ok:true,
   appliance:{name:d.name,type:d.type,connected:d.connected},
   ready:{
    remoteStartAllowed:value("BSH.Common.Status.RemoteControlStartAllowed")===true,
    remoteControlActive:value("BSH.Common.Status.RemoteControlActive")===true,
    door:value("BSH.Common.Status.DoorState"),
    operationState:value("BSH.Common.Status.OperationState")
   },
   programs:(p?.data?.programs||[]).map(x=>({key:x.key,name:x.name,execution:x?.constraints?.execution})),
   selected:p?.data?.selected?.key||null,
   safety:"read-only"
  });
 }catch(e){res.status(500).json({ok:false,error:e.message});}
}
