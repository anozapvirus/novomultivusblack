import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import fs from "fs";
import path from "path";
// import { preference, payment } from "../config/MercadoPago";

import Company from "../models/Company";
import Invoices from "../models/Invoices";
import { getIO } from "../libs/socket";
import Plan from "../models/Plan";

export const createSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const logToFile = (message: string) => {
    const logPath = path.resolve(__dirname, '..', '..', 'error.log');
    fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`);
  };

  try {
    console.log("=== Iniciando createSubscription ===");
    logToFile("=== Nova tentativa de criar assinatura ===");
    
    // Verifica autenticação
    if (!req.user?.companyId) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const { companyId } = req.user;
    logToFile(`CompanyId: ${companyId}`);

    // Validação básica
    const schema = Yup.object().shape({
      invoiceId: Yup.number().required("ID da fatura é obrigatório")
    });

    try {
      await schema.validate(req.body);
    } catch (err) {
      logToFile(`Erro de validação: ${err.errors}`);
      throw new AppError(err.errors.join(", "), 400);
    }

    const { invoiceId } = req.body;

    // Busca a fatura
    const invoice = await Invoices.findByPk(invoiceId);
    if (!invoice) {
      logToFile(`Fatura não encontrada: ${invoiceId}`);
      throw new AppError("Fatura não encontrada", 404);
    }

    // Verifica se a fatura pertence à empresa
    if (invoice.companyId !== companyId) {
      logToFile(`Fatura não pertence à empresa: Invoice.companyId=${invoice.companyId}, companyId=${companyId}`);
      throw new AppError("Fatura não pertence à empresa", 403);
    }

    // Busca a empresa
    const company = await Company.findByPk(companyId);
    if (!company) {
      logToFile(`Empresa não encontrada: ${companyId}`);
      throw new AppError("Empresa não encontrada", 404);
    }

    // Busca o plano
    const plan = await Plan.findByPk(company.planId);
    if (!plan) {
      logToFile(`Plano não encontrado: ${company.planId}`);
      throw new AppError("Plano não encontrado", 404);
    }

    // Formata o preço
    const priceNumber = Number(invoice.value);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      logToFile(`Valor inválido: ${invoice.value}`);
      throw new AppError("Valor da fatura inválido ou menor/igual a zero", 400);
    }

    try {
      // Cria o pagamento PIX no Mercado Pago
      const paymentData = {
        body: {
          transaction_amount: priceNumber,
          description: `Fatura #${invoiceId} - ${plan.name}`,
          payment_method_id: 'pix',
          payer: {
            email: company.email,
            first_name: company.name,
            identification: {
              type: company.document?.length === 11 ? 'CPF' : 'CNPJ',
              number: company.document || ''
            }
          },
          external_reference: String(invoiceId)
        }
      };

      logToFile(`Criando pagamento PIX no Mercado Pago: ${JSON.stringify(paymentData, null, 2)}`);

      // Comentar todas as referências ao MercadoPago até que seja necessário
      // const response = await payment.create(paymentData);

      // if (!response?.id) {
      //   logToFile('Resposta inválida do Mercado Pago');
      //   throw new AppError("Erro ao gerar QR code PIX", 500);
      // }

      // logToFile(`Resposta do Mercado Pago: ${JSON.stringify(response, null, 2)}`);

      const result = {
        id: "mock_id", // Placeholder, as payment.create is commented out
        qrcode: {
          qrcode: "mock_qrcode", // Placeholder
          imagemQrcode: "mock_imagemQrcode", // Placeholder
          imagemQrcodePix: "mock_imagemQrcodePix" // Placeholder
        },
        valor: {
          original: priceNumber
        },
        plano: plan.name,
        cliente: company.name,
        status: 'pending',
        payment_type: 'pix',
        external_reference: String(invoiceId)
      };

      logToFile(`Retornando resultado: ${JSON.stringify(result, null, 2)}`);
      return res.json(result);
    } catch (mpError: any) {
      logToFile(`Erro no Mercado Pago: ${JSON.stringify({
        message: mpError.message,
        name: mpError.name,
        response: mpError.response?.data,
        status: mpError.status
      }, null, 2)}`);
      
      throw new AppError(
        `Erro ao gerar QR code PIX: ${mpError.message || 'Erro desconhecido'}`,
        mpError.status || 500
      );
    }
  } catch (error: any) {
    logToFile(`Erro geral: ${JSON.stringify({
      message: error.message,
      stack: error.stack,
      status: error.statusCode || 500
    }, null, 2)}`);

    throw new AppError(
      error.message || "Erro ao criar a assinatura",
      error.statusCode || 500
    );
  }
};

export const webhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const logToFile = (message: string) => {
    const logPath = path.resolve(__dirname, '..', '..', 'webhook.log');
    fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`);
  };

  try {
    const { type } = req.params;
    const { data, action } = req.body;

    logToFile(`Webhook recebido - Type: ${type}, Action: ${action}, Data: ${JSON.stringify(data)}`);

    if (type !== "mercadopago") {
      return res.json({ ok: true });
    }

    // Verifica se é uma notificação de pagamento
    if (action === "payment.updated" || action === "payment.created") {
      if (data.id) {
        logToFile(`Buscando informações do pagamento ${data.id}`);
        // Comentar todas as referências ao MercadoPago até que seja necessário
        // const paymentInfo = await payment.get({ id: data.id });
        
        // logToFile(`Status do pagamento: ${paymentInfo.status}`);
        
        // if (paymentInfo.status === "approved") {
        //   const invoiceId = paymentInfo.external_reference;
        //   logToFile(`Processando pagamento aprovado para fatura ${invoiceId}`);
          
        //   const invoice = await Invoices.findByPk(invoiceId);
          
        //   if (invoice) {
        //     // Verifica se a fatura já foi processada
        //     if (invoice.status === 'paid') {
        //       return res.json({
        //         status: paymentInfo.status,
        //         success: true,
        //         message: "Pagamento já foi processado anteriormente!"
        //       });
        //     }

        //     logToFile(`Fatura encontrada: ${JSON.stringify(invoice)}`);
        //     const company = await Company.findByPk(invoice.companyId);
            
        //     if (company) {
        //       logToFile(`Empresa encontrada: ${JSON.stringify(company)}`);
              
        //       // Calcula a nova data de vencimento
        //       const currentDueDate = new Date(company.dueDate);
        //       const today = new Date();
              
        //       // Se a data atual já passou da data de vencimento, usa a data atual como base
        //       const baseDate = currentDueDate < today ? today : currentDueDate;
        //       const expiresAt = new Date(baseDate);
        //       expiresAt.setDate(expiresAt.getDate() + 30);
        //       const date = expiresAt.toISOString().split("T")[0];

        //       logToFile(`Atualizando data de vencimento para: ${date}`);

        //       // Atualiza a empresa
        //       await company.update({
        //         dueDate: date
        //       });

        //       // Atualiza a fatura
        //       await invoice.update({
        //         status: 'paid',
        //         paymentDate: new Date(),
        //         lastStatus: paymentInfo.status
        //       });

        //       await company.reload();

        //       // Notifica o frontend
        //       const io = getIO();
        //       io.emit(`company-${company.id}-payment`, {
        //         action: "CONCLUIDA",
        //         company: company
        //       });

        //       logToFile(`Pagamento processado com sucesso para empresa ${company.id}`);
        //     } else {
        //       logToFile(`Empresa não encontrada para a fatura ${invoiceId}`);
        //     }
        //   } else {
        //     logToFile(`Fatura não encontrada: ${invoiceId}`);
        //   }
        // } else {
        //   logToFile(`Status do pagamento não é approved: ${paymentInfo.status}`);
        // }
      }
    } else {
      logToFile(`Tipo de ação não suportada: ${action}`);
    }

    return res.json({ ok: true });
  } catch (error) {
    logToFile(`Erro no webhook: ${error.message}`);
    console.error(error);
    // Retorna 200 mesmo com erro para o Mercado Pago não retentar
    return res.json({ ok: true });
  }
};

export const checkPaymentStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { paymentId } = req.params;

  try {
    // Comentar todas as referências ao MercadoPago até que seja necessário
    // const paymentInfo = await payment.get({ id: paymentId });
    
    // if (paymentInfo.status === "approved") {
    //   const invoiceId = paymentInfo.external_reference;
    //   const invoice = await Invoices.findByPk(invoiceId);
      
    //   if (invoice) {
    //     // Verifica se a fatura já foi processada
    //     if (invoice.status === 'paid') {
    //       return res.json({
    //         status: paymentInfo.status,
    //         success: true,
    //         message: "Pagamento já foi processado anteriormente!"
    //       });
    //     }

    //     const company = await Company.findByPk(invoice.companyId);
        
    //     if (company) {
    //       // Calcula a nova data de vencimento
    //       const currentDueDate = new Date(company.dueDate);
    //       const today = new Date();
          
    //       // Se a data atual já passou da data de vencimento, usa a data atual como base
    //       const baseDate = currentDueDate < today ? today : currentDueDate;
    //       const expiresAt = new Date(baseDate);
    //       expiresAt.setDate(expiresAt.getDate() + 30);
    //       const date = expiresAt.toISOString().split("T")[0];

    //       // Atualiza a empresa
    //       await company.update({
    //         dueDate: date
    //       });

    //       // Atualiza a fatura
    //       await invoice.update({
    //         status: 'paid',
    //         paymentDate: new Date(),
    //         lastStatus: paymentInfo.status
    //       });

    //       await company.reload();

    //       return res.json({
    //         status: paymentInfo.status,
    //         company,
    //         success: true,
    //         message: "Pagamento aprovado com sucesso!"
    //       });
    //     }
    //   }
    // }

    return res.json({
      status: "mock_status", // Placeholder
      success: false
    });

  } catch (error) {
    console.error(error);
    throw new AppError(
      "Erro ao verificar status do pagamento",
      500
    );
  }
};
