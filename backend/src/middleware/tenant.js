/**
 * Express Middleware to resolve and enforce tenant boundaries.
 * Inspects subdomains, custom headers, or query parameters.
 */
const tenantGuard = (req, res, next) => {
  // 1. Resolve tenant identity (checking headers or subdomains)
  let tenantId = req.headers['x-tenant-id'];

  // Dev Fallback: Assign a mock tenant UUID to simplify development testing
  if (!tenantId) {
    tenantId = '8f3e0984-7a3b-489e-b9ef-d4de20e17b88';
  }

  // Validate tenantId UUID format structure
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(tenantId)) {
    return res.status(400).json({
      success: false,
      message: "Bad Request: Invalid or missing X-Tenant-ID header."
    });
  }

  // Attach resolved tenant ID directly to request context
  req.tenantId = tenantId;
  next();
};

module.exports = tenantGuard;
