export const environment = {
  production: true,
  firebaseConfig: {
    apiKey: process.env.FIREBASECONFIG_APIKEY,
    authDomain: process.env.FIREBASECONFIG_AUTHDOMAIN,
    projectId: process.env.FIREBASECONFIG_PROJECTID,
    storageBucket: process.env.FIREBASECONFIG_STORAGEBUCKET,
    messagingSenderId: process.env.FIREBASECONFIG_MESSAGINGSENDERID,
    appId: process.env.FIREBASECONFIG_APPID,
  },
};
