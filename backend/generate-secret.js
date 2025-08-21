const crypto = require('crypto');

// Generate JWT Secret
const generateJWTSecret = () => {
    // Generate 64 bytes (512 bits) random string
    const secret = crypto.randomBytes(64).toString('hex');
    
    console.log('🔐 JWT Secret Generated Successfully!');
    console.log('=====================================');
    console.log(`JWT_SECRET=${secret}`);
    console.log('=====================================');
    console.log('');
    console.log('📝 Copy this line to your .env file:');
    console.log(`JWT_SECRET=${secret}`);
    console.log('');
    console.log('⚠️  Keep this secret secure and never share it!');
    console.log('⚠️  Use different secrets for different environments!');
    
    return secret;
};

// Generate multiple secrets for different environments
const generateEnvironmentSecrets = () => {
    console.log('🌍 Generating JWT Secrets for Different Environments');
    console.log('==================================================');
    console.log('');
    
    const development = crypto.randomBytes(64).toString('hex');
    const staging = crypto.randomBytes(64).toString('hex');
    const production = crypto.randomBytes(64).toString('hex');
    
    console.log('Development:');
    console.log(`JWT_SECRET=${development}`);
    console.log('');
    
    console.log('Staging:');
    console.log(`JWT_SECRET=${staging}`);
    console.log('');
    
    console.log('Production:');
    console.log(`JWT_SECRET=${production}`);
    console.log('');
    
    console.log('📝 Add these to your respective .env files');
};

// Run the generator
if (process.argv.includes('--env')) {
    generateEnvironmentSecrets();
} else {
    generateJWTSecret();
}





