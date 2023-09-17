export const environment = {
  production: false,
  keycloak: {
    url: 'http://192.168.0.189:8080',
    realm: 'Emovies',
    clientId: 'admin-cli'
  },
  endpoint: {
    backend: 'api-backend',
    processing: 'api-processing',
    tmdb_image: 'https://image.tmdb.org/t/p/original',
  }
};
