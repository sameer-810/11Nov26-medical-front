const ENV = {
  development: {
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL_DEV || "http://localhost:5002/api/v1",
    socketUrl:
      process.env.EXPO_PUBLIC_SOCKET_URL_DEV || "http://localhost:5002",
  },
  production: {
    // Same backend as the EAS builds (eas.json); EXPO_PUBLIC_* overrides it.
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL ||
      "https://two3-jun26-medical-back.onrender.com/api/v1",
    socketUrl:
      process.env.EXPO_PUBLIC_SOCKET_URL ||
      "https://two3-jun26-medical-back.onrender.com",
  },
};

const getEnv = () => (__DEV__ ? ENV.development : ENV.production);

export const environment = getEnv();
