const router = require("express").Router();
const { login, refreshToken, logout, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/login",   login);
router.post("/refresh", refreshToken);
router.post("/logout",  logout);
router.get("/me",       protect, getMe);

module.exports = router;