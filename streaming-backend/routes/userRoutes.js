const express=require("express");
const router=express.Router();

const{getUsers,makeEmployee}=require("../controllers/userController");

router.get("/",getUsers);
router.put("/makeEmployee/:id",makeEmployee);

module.exports=router;