import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User.js';
// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
    passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
    var _a, _b, _c, _d, _e, _f;
    try {
        console.log('🔍 Google OAuth Strategy - Profile received:', {
            id: profile.id,
            email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
            name: profile.displayName
        });
        // Find or create user
        let user = await User.findOne({ where: { google_id: profile.id } });
        console.log('🔍 Database lookup result:', user ? 'User found' : 'User not found');
        if (!user) {
            console.log('🔍 Creating new user...');
            user = await User.create({
                google_id: profile.id,
                email: (_d = (_c = profile.emails) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value,
                name: `${((_e = profile.name) === null || _e === void 0 ? void 0 : _e.givenName) || ''} ${((_f = profile.name) === null || _f === void 0 ? void 0 : _f.familyName) || ''}`.trim(),
            });
            console.log('✅ New user created:', { id: user.id, email: user.email });
        }
        return done(null, user);
    }
    catch (error) {
        console.error('❌ Error in Google strategy:', error);
        if (error instanceof Error) {
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
        return done(error, null);
    }
}));
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
