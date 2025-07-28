import nodemailer from "nodemailer";

export interface MailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function SendMail(mailData: MailData) {
  // Verificar se as configurações de email estão definidas
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS || !process.env.MAIL_FROM) {
    throw new Error("Configurações de email não encontradas");
  }

  const options: any = {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT) : 587,
    secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  };

  // Adicionar configurações específicas para Gmail
  if (process.env.MAIL_HOST === 'smtp.gmail.com') {
    options.service = 'gmail';
  }

  try {
    const transporter = nodemailer.createTransport(options);

    // Verificar conexão
    await transporter.verify();

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: process.env.MAIL_FROM, // sender address
      to: mailData.to, // list of receivers
      subject: mailData.subject, // Subject line
      text: mailData.text, // plain text body
      html: mailData.html || mailData.text // html body
    });

    console.log("Email enviado com sucesso: %s", info.messageId);
    
    // Preview only available when sending through an Ethereal account
    if (process.env.NODE_ENV === 'development') {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw error;
  }
}
