// middleware/auth.js
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.adminId) {
    return res.redirect('/admin/login');
  }
  next();
}

module.exports = { requireAdmin };
