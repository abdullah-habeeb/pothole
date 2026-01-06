export const requireGovernmentAccess = (req, res, next) => {
  if (!req.user || !req.user.isGovernmentAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Government authorization required for this action',
    });
  }
  next();
};

export default requireGovernmentAccess;

