# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within Focus Flow, please send an email to [your-email@example.com]. All security vulnerabilities will be promptly addressed.

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

## Security Best Practices

### For Developers

1. **Never commit secrets or credentials** to the repository
2. **Use environment variables** for all sensitive configuration
3. **Keep dependencies updated** to patch known vulnerabilities
4. **Follow secure coding practices** and review code for security issues

### For Users

1. **Keep the extension updated** to the latest version
2. **Review permissions** before installing the extension
3. **Report suspicious activity** through the security email

## Security Features

- **No data collection**: The extension does not collect or transmit personal data
- **Local processing**: Website blocking decisions are made locally when possible
- **Secure API calls**: All external API calls use HTTPS and proper authentication
- **Permission minimization**: Only requests necessary browser permissions

## Vulnerability Disclosure

We are committed to responsible disclosure of security vulnerabilities. When a vulnerability is reported:

1. We will acknowledge receipt within 48 hours
2. We will investigate and provide updates on progress
3. We will release a fix as soon as possible
4. We will credit the reporter in our security advisories

## Security Checklist

- [x] No hardcoded secrets in source code
- [x] Environment variables for sensitive configuration
- [x] HTTPS for all external communications
- [x] Input validation and sanitization
- [x] Regular dependency updates
- [x] Secure deployment practices

## Contact

- **Security Email**: [your-email@example.com]
- **Project Maintainer**: Ronak Prabhu
- **GitHub Issues**: For non-security related issues only

---

**Note**: This security policy is a living document and will be updated as needed to reflect current security practices and requirements.
