/* ─── SMS Service ───────────────────────────────────────────────────────── */
const twilio = require('twilio');

// Store SMS codes in memory (for demo - in production use Redis)
const smsCodes = new Map();

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendSms = async (phone, code) => {
  const provider = process.env.SMS_PROVIDER || 'demo';
  
  if (provider === 'demo') {
    // Demo mode - return code in response
    console.log(`📱 SMS Demo Mode: Code for ${phone} is ${code}`);
    return { success: true, demoCode: code };
  }
  
  if (provider === 'twilio') {
    try {
      const client = twilio(
        process.env.SMS_ACCOUNT_SID,
        process.env.SMS_AUTH_TOKEN
      );
      
      await client.messages.create({
        body: `Ваш код подтверждения: ${code}`,
        from: process.env.SMS_FROM_NUMBER,
        to: phone
      });
      
      return { success: true };
    } catch (error) {
      console.error('SMS sending error:', error);
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, error: 'Unknown SMS provider' };
};

const storeCode = (phone, code) => {
  // Store code with 5 minute expiry
  smsCodes.set(phone, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000
  });
};

const verifyCode = (phone, code) => {
  const stored = smsCodes.get(phone);
  if (!stored) return false;
  
  if (Date.now() > stored.expiresAt) {
    smsCodes.delete(phone);
    return false;
  }
  
  const isValid = stored.code === code;
  if (isValid) {
    smsCodes.delete(phone);
  }
  
  return isValid;
};

module.exports = {
  generateCode,
  sendSms,
  storeCode,
  verifyCode
};
