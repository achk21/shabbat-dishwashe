import { hc } from "../../lib/homeconnect.js";
export default async function handler(req,res){
 try{
  const a=await hc("/homeappliances");
  const appliances=a?.data?.homeappliances||[];
  const dishwasher=appliances.find(x=>String(x.type).toLowerCase()==="dishwasher")||appliances[0];
  if(!dishwasher) return res.status(404).json({ok:false,error:"No appliance found"});
  const haId=encodeURIComponent(dishwasher.haId);
  const [status,programs]=await Promise.all([
    hc(`/homeappliances/${haId}/status`).catch(e=>({error:e.message})),
    hc(`/homeappliances/${haId}/programs/available`).catch(e=>({error:e.message}))
  ]);
  res.status(200).json({ok:true,appliance:{name:dishwasher.name,type:dishwasher.type,connected:dishwasher.connected},status,programs});
 }catch(e){res.status(500).json({ok:false,error:e.message});}
}
