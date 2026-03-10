const express = require("express");
const router  = express.Router();
const {
  getUsers, deleteUser,
  makeEmployee, demoteEmployee, updateEmployeeLanguage,
  getCollections, createCollection,
  addToCollection, removeFromCollection, deleteCollection,
} = require("../controllers/userController");

router.get   ("/",                  getUsers);
router.delete("/:id",               deleteUser);
router.put   ("/makeEmployee/:id",  makeEmployee);
router.put   ("/demote/:id",        demoteEmployee);
router.put   ("/updateLang/:id",    updateEmployeeLanguage);

router.get   ("/:id/collections",                               getCollections);
router.post  ("/:id/collections",                               createCollection);
router.post  ("/:id/collections/:collectionId/movies",          addToCollection);
router.delete("/:id/collections/:collectionId/movies/:movieId", removeFromCollection);
router.delete("/:id/collections/:collectionId",                 deleteCollection);

module.exports = router;