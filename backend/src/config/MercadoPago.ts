// Configuração do MercadoPago (comentada até ser necessária)
// import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
}

// Configuração do MercadoPago (comentada até ser necessária)
// const client = new MercadoPagoConfig({
//   accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
//   options: { timeout: 5000 }
// });

// export const preference = new Preference(client);
// export const payment = new Payment(client);
// export const mercadopagoConfig = client; 