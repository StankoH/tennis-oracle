import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/user.model.js';

// Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0].value;
                let user = await User.findOne({ email });

                if (user) {
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        user.provider = 'google';
                        user.isVerified = true;
                        await user.save();
                    }
                    return done(null, user);
                }

                const newUser = await User.create({
                    googleId: profile.id,
                    name: profile.displayName,
                    email,
                    provider: 'google',
                    isUser: true,
                    isVerified: true,
                });

                return done(null, newUser);
            } catch (err) {
                done(err, null);
            }
        }
    )
);

// Facebook Strategy
passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackURL: "/api/auth/facebook/callback",
            profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
            scope: ['email', 'public_profile'] // Dodaj scope ovdje
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                const facebookId = profile.id;
                const name = `${profile.name?.givenName} ${profile.name?.familyName}`.trim(); // Dodana provjera za undefined
                const avatar = profile.photos?.[0]?.value;

                let user = await User.findOne({ $or: [{ email }, { facebookId }] });

                if (user) {
                    if (!user.provider?.includes('facebook')) { // Dodana provjera za undefined
                        user.provider?.push('facebook');
                        user.facebookId = facebookId;
                        await user.save();
                    }
                    return done(null, user);
                }

                const newUser = new User({
                    name,
                    email,
                    facebookId,
                    isUser: true,
                    isVerified: true,
                    avatar,
                    createdVia: 'facebook',
                    provider: ['facebook']
                });

                await newUser.save();
                done(null, newUser);
            } catch (err) {
                done(err, null);
            }
        }
    )
);