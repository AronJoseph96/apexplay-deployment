const User=require("../models/User");

exports.getUsers=async(req,res)=>{
try{
const users=await User.find();
res.json(users);
}catch(err){
res.status(500).json({error:err.message});
}
};

exports.makeEmployee=async(req,res)=>{
try{
const{language}=req.body;
const user=await User.findById(req.params.id);
user.role="EMPLOYEE";
user.language=language;
await user.save();
res.json(user);
}catch(err){
res.status(500).json({error:err.message});
}
};