import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { isEmpty, isNil } from "lodash";
import CheckSettingsHelper from "../helpers/CheckSettings";
import AppError from "../errors/AppError";

import CreateUserService from "../services/UserServices/CreateUserService";
import ListUsersService from "../services/UserServices/ListUsersService";
import UpdateUserService from "../services/UserServices/UpdateUserService";
import ShowUserService from "../services/UserServices/ShowUserService";
import DeleteUserService from "../services/UserServices/DeleteUserService";
import SimpleListService from "../services/UserServices/SimpleListService";
import CreateCompanyService from "../services/CompanyService/CreateCompanyService";
import { SendMail } from "../helpers/SendMail";
import { useDate } from "../utils/useDate";
import ShowCompanyService from "../services/CompanyService/ShowCompanyService";
import { getWbot } from "../libs/wbot";
import FindCompaniesWhatsappService from "../services/CompanyService/FindCompaniesWhatsappService";
import User from "../models/User";

import { head } from "lodash";
import ToggleChangeWidthService from "../services/UserServices/ToggleChangeWidthService";
import APIShowEmailUserService from "../services/UserServices/APIShowEmailUserService";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";


type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};


export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId, profile } = req.user;

  const { users, count, hasMore } = await ListUsersService({
    searchParam,
    pageNumber,
    companyId,
    profile
  });

  return res.json({ users, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    email,
    password,
    name,
    phone,
    profile,
    document: rawDocument,
    companyId: bodyCompanyId,
    queueIds,
    companyName,
    planId,
    startWork,
    endWork,
    whatsappId,
    allTicket,
    defaultTheme,
    defaultMenu,
    allowGroup,
    allHistoric,
    allUserChat,
    userClosePendingTicket,
    showDashboard,
    defaultTicketsManagerWidth = 550,
    allowRealTime,
    allowConnections
  } = req.body;
  
  // Remover formatação do documento (CPF/CNPJ) - manter apenas números
  const document = rawDocument ? rawDocument.replace(/[^\d]+/g, '') : '';
  
  let userCompanyId: number | null = null;

  const { dateToClient } = useDate();

  if (req.user !== undefined) {
    const { companyId: cId } = req.user;
    userCompanyId = cId;
  }

  if (
    req.url === "/signup" &&
    (await CheckSettingsHelper("userCreation")) === "disabled"
  ) {
    throw new AppError("ERR_USER_CREATION_DISABLED", 403);
  } else if (req.url !== "/signup" && req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (process.env.DEMO === "ON") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const companyUser = bodyCompanyId || userCompanyId;

  if (!companyUser) {

    const dataNowMoreTwoDays = new Date();
    dataNowMoreTwoDays.setDate(dataNowMoreTwoDays.getDate() + 3);

    const date = dataNowMoreTwoDays.toISOString().split("T")[0];

    const companyData = {
      name: companyName,
      email: email,
      phone: phone,
      planId: planId,
      status: true,
      dueDate: date,
      recurrence: "",
      document: document,
      paymentMethod: "",
      password: password,
      companyUserName: name,
      startWork: startWork,
      endWork: endWork,
      defaultTheme: 'light',
      defaultMenu: 'closed',
      allowGroup: false,
      allHistoric: false,
      userClosePendingTicket: 'enabled',
      showDashboard: 'disabled',
      defaultTicketsManagerWidth: 550,
      allowRealTime: 'disabled',
      allowConnections: 'disabled'
    };

    const user = await CreateCompanyService(companyData);

    try {
      const _email = {
        to: email,
        subject: `Login e senha da Empresa ${companyName}`,
        text: `Olá ${name}, este é um email sobre o cadastro da ${companyName}!<br><br>
        Segue os dados da sua empresa:<br><br>Nome: ${companyName}<br>Email: ${email}<br>Senha: ${password}<br>Data Vencimento Trial: ${dateToClient(date)}`
      }

      await SendMail(_email)
    } catch (error) {
      console.log('Não consegui enviar o email')
    }

    try {
      const company = await ShowCompanyService(1);
      const whatsappCompany = await FindCompaniesWhatsappService(company.id)

      if (whatsappCompany.whatsapps[0].status === "CONNECTED" && (phone !== undefined || !isNil(phone) || !isEmpty(phone))) {
        const whatsappId = whatsappCompany.whatsapps[0].id
        const wbot = getWbot(whatsappId);

        const body = `Olá ${name}, este é uma mensagem sobre o cadastro da ${companyName}!\n\nSegue os dados da sua empresa:\n\nNome: ${companyName}\nEmail: ${email}\nSenha: ${password}\nData Vencimento Trial: ${dateToClient(date)}`

        await wbot.sendMessage(`55${phone}@s.whatsapp.net`, { text: body });
      }
    } catch (error) {
      console.log('Não consegui enviar a mensagem')
    }

    return res.status(200).json(user);
  }

  if (companyUser) {
    const user = await CreateUserService({
      email,
      password,
      name,
      profile,
      companyId: companyUser,
      queueIds,
      startWork,
      endWork,
      whatsappId,
      allTicket,
      defaultTheme,
      defaultMenu,
      allowGroup,
      allHistoric,
      allUserChat,
      userClosePendingTicket,
      showDashboard,
      defaultTicketsManagerWidth,
      allowRealTime,
      allowConnections
    });

    const io = getIO();
    io.of(userCompanyId.toString())
      .emit(`company-${userCompanyId}-user`, {
        action: "create",
        user
      });

    return res.status(200).json(user);
  }
};

// export const store = async (req: Request, res: Response): Promise<Response> => {
//   const {
//     email,
//     password,
//     name,
//     profile,
//     companyId: bodyCompanyId,
//     queueIds
//   } = req.body;
//   let userCompanyId: number | null = null;

//   if (req.user !== undefined) {
//     const { companyId: cId } = req.user;
//     userCompanyId = cId;
//   }

//   if (
//     req.url === "/signup" &&
//     (await CheckSettingsHelper("userCreation")) === "disabled"
//   ) {
//     throw new AppError("ERR_USER_CREATION_DISABLED", 403);
//   } else if (req.url !== "/signup" && req.user.profile !== "admin") {
//     throw new AppError("ERR_NO_PERMISSION", 403);
//   }

//   const user = await CreateUserService({
//     email,
//     password,
//     name,
//     profile,
//     companyId: bodyCompanyId || userCompanyId,
//     queueIds
//   });

//   const io = getIO();
//   io.of(String(companyId))
//  .emit(`company-${userCompanyId}-user`, {
//     action: "create",
//     user
//   });

//   return res.status(200).json(user);
// };

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;
  const { companyId } = req.user;

  const user = await ShowUserService(userId, companyId);

  return res.status(200).json(user);
};

export const showEmail = async (req: Request, res: Response): Promise<Response> => {
  const { email } = req.params;

  const user = await APIShowEmailUserService(email);

  return res.status(200).json(user);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {

  // if (req.user.profile !== "admin") {
  //   throw new AppError("ERR_NO_PERMISSION", 403);
  // }

  if (process.env.DEMO === "ON") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { id: requestUserId, companyId } = req.user;
  const { userId } = req.params;
  const userData = req.body;

  const user = await UpdateUserService({
    userData,
    userId,
    companyId,
    requestUserId: +requestUserId
  });


  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-user`, {
      action: "update",
      user
    });

  return res.status(200).json(user);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId } = req.params;
  const { companyId, id, profile } = req.user;

  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (process.env.DEMO === "ON") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const user = await User.findOne({
    where: { id: userId }
  });

  if (companyId !== user.companyId) {
    return res.status(400).json({ error: "Você não possui permissão para acessar este recurso!" });
  } else {
    await DeleteUserService(userId, companyId);

    const io = getIO();
    io.of(String(companyId))
      .emit(`company-${companyId}-user`, {
        action: "delete",
        userId
      });

    return res.status(200).json({ message: "User deleted" });
  }

};

export const list = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.query;
  const { companyId: userCompanyId } = req.user;

  const users = await SimpleListService({
    companyId: companyId ? +companyId : userCompanyId
  });

  return res.status(200).json(users);
};

export const mediaUpload = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userId } = req.params;
  const { companyId } = req.user;
  const files = req.files as Express.Multer.File[];
  const file = head(files);

  try {
    let user = await User.findByPk(userId);
    user.profileImage = file.filename.replace('/', '-');

    await user.save();

    user = await ShowUserService(userId, companyId);
    
    const io = getIO();
    io.of(String(companyId))
      .emit(`company-${companyId}-user`, {
        action: "update",
        user
      });


    return res.status(200).json({ user, message: "Imagem atualizada" });
  } catch (err: any) {
    throw new AppError(err.message);
  }
};

export const toggleChangeWidht = async (req: Request, res: Response): Promise<Response> => {
  var { userId } = req.params;
  const { defaultTicketsManagerWidth } = req.body;

  const { companyId } = req.user;
  const user = await ToggleChangeWidthService({ userId, defaultTicketsManagerWidth });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-user`, {
      action: "update",
      user
    });

  return res.status(200).json(user);
};

export const recoverPassword = async (req: Request, res: Response): Promise<Response> => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("ERR_EMAIL_REQUIRED", 400);
  }

  // Validar formato do email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("ERR_INVALID_EMAIL_FORMAT", 400);
  }

  // Verificar se as configurações de email estão definidas
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS || !process.env.MAIL_FROM) {
    console.error("Configurações de email não encontradas. Verifique as variáveis de ambiente MAIL_HOST, MAIL_USER, MAIL_PASS e MAIL_FROM");
    throw new AppError("ERR_EMAIL_CONFIG_MISSING", 500);
  }

  const user = await User.findOne({
    where: { email }
  });

  if (!user) {
    return res.status(200).json({ message: "Se o email existir, você receberá as instruções de recuperação" });
  }

  // Verificar se já existe um token válido (evitar spam)
  if (user.resetPasswordToken && user.resetPasswordExpires && user.resetPasswordExpires > new Date()) {
    return res.status(200).json({ message: "Se o email existir, você receberá as instruções de recuperação" });
  }

  // Gerar token único e definir expiração (24 horas)
  const resetToken = uuidv4();
  const resetExpires = new Date();
  resetExpires.setHours(resetExpires.getHours() + 24);

  try {
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const _email = {
      to: email,
      subject: "Recuperação de Senha",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperação de Senha</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f7fb;">
          <div style="width: 100%; max-width: 100%; margin: 0 auto; background-color: #f5f7fb; padding: 20px 0;">
            <!-- Container Principal -->
            <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); padding: 32px 24px; border: 1px solid rgba(0, 47, 108, 0.06);">
              
              <!-- Logo -->
              <div style="text-align: center; margin-bottom: 24px;">
                <img src="${process.env.FRONTEND_URL}/logo.png" alt="Logo" style="max-width: 140px; height: auto;">
              </div>

              <!-- Ícone e Título -->
              <div style="text-align: center; margin-bottom: 28px;">
                <h1 style="color: #1a2942; font-size: 22px; font-weight: 600; margin: 0; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Recuperação de Senha
                </h1>
              </div>

              <!-- Mensagem -->
              <div style="text-align: center; margin-bottom: 28px;">
                <p style="color: #4a5567; font-size: 15px; line-height: 1.5; margin: 0 0 16px 0; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Olá <strong style="color: #1a2942;">${user.name}</strong>,<br>
                  Recebemos uma solicitação para redefinir sua senha.
                </p>
              </div>

              <!-- Botão -->
              <div style="text-align: center; margin-bottom: 28px;">
                <a href="${resetLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #0046a5 0%, #0055c8 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; letter-spacing: 0.3px; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; transition: all 0.2s ease;">
                  Redefinir Senha
                </a>
              </div>

              <!-- Link Alternativo -->
              <div style="text-align: center; background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #4a5567; font-size: 13px; margin: 0 0 8px 0; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Se o botão não funcionar, copie e cole este link no seu navegador:
                </p>
                <a href="${resetLink}" 
                   style="color: #0055c8; font-size: 12px; word-break: break-all; text-decoration: none; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  ${resetLink}
                </a>
              </div>

              <!-- Tempo de Expiração -->
              <div style="text-align: center; background-color: #f0f7ff; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="color: #4a5567; font-size: 13px; margin: 0; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Este link é válido por <strong style="color: #1a2942;">24 horas</strong>
                </p>
              </div>

              <!-- Aviso de Segurança -->
              <div style="background-color: #fff8f0; border-left: 3px solid #ffb74d; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px;">
                <p style="color: #b45309; font-size: 13px; margin: 0; line-height: 1.5; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Se você não solicitou esta alteração, ignore este email ou entre em contato com nosso suporte.
                </p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 28px; padding-top: 24px; border-top: 1px solid #edf2f7;">
                <p style="color: #4a5567; font-size: 13px; margin: 0 0 16px 0; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  Precisa de ajuda? <a href="https://wa.me/5561982213735" style="color: #0055c8; text-decoration: none;">Entre em contato</a>
                </p>

                <!-- Copyright -->
                <p style="color: #8795a7; font-size: 12px; margin: 0; font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  © ${new Date().getFullYear()} Multivus. Todos os direitos reservados.
                </p>
              </div>

            </div>
          </div>
        </body>
        </html>
      `
    };

    await SendMail(_email);
    
    console.log(`Email de recuperação enviado para: ${email}`);
    
    return res.status(200).json({ 
      message: "Se o email existir, você receberá as instruções de recuperação" 
    });
  } catch (err) {
    console.error("Erro ao enviar email de recuperação:", err);
    
    // Limpar token em caso de erro
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    
    throw new AppError("ERR_SENDING_EMAIL", 500);
  }
};

// Novo endpoint para realizar o reset da senha
export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    throw new AppError("ERR_MISSING_RESET_INFO", 400);
  }

  // Validar força da senha
  if (password.length < 6) {
    throw new AppError("ERR_PASSWORD_TOO_SHORT", 400);
  }

  if (password !== confirmPassword) {
    throw new AppError("ERR_PASSWORDS_DO_NOT_MATCH", 400);
  }

  const user = await User.findOne({
    where: { 
      resetPasswordToken: token,
      resetPasswordExpires: {
        [Op.gt]: new Date() // Verifica se o token ainda não expirou
      }
    }
  });

  if (!user) {
    throw new AppError("ERR_INVALID_RESET_TOKEN", 400);
  }

  try {
    // Atualizar senha
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    console.log(`Senha redefinida com sucesso para o usuário: ${user.email}`);

    return res.status(200).json({ message: "Senha atualizada com sucesso" });
  } catch (err) {
    console.error("Erro ao redefinir senha:", err);
    throw new AppError("ERR_PASSWORD_UPDATE_FAILED", 500);
  }
};