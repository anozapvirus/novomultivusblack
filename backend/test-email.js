require('dotenv').config();
const { SendMail } = require('./src/helpers/SendMail');

async function testEmail() {
  console.log('Testando configurações de email...');
  
  // Verificar variáveis de ambiente
  console.log('Variáveis de ambiente:');
  console.log('MAIL_HOST:', process.env.MAIL_HOST);
  console.log('MAIL_PORT:', process.env.MAIL_PORT);
  console.log('MAIL_SECURE:', process.env.MAIL_SECURE);
  console.log('MAIL_USER:', process.env.MAIL_USER);
  console.log('MAIL_FROM:', process.env.MAIL_FROM);
  console.log('MAIL_PASS:', process.env.MAIL_PASS ? '***configurado***' : '***não configurado***');
  
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS || !process.env.MAIL_FROM) {
    console.error('❌ Configurações de email incompletas!');
    console.error('Configure as seguintes variáveis de ambiente:');
    console.error('- MAIL_HOST');
    console.error('- MAIL_USER');
    console.error('- MAIL_PASS');
    console.error('- MAIL_FROM');
    return;
  }
  
  try {
    const testEmail = {
      to: process.env.MAIL_USER, // Enviar para o próprio email configurado
      subject: 'Teste de Configuração - Sistema de Recuperação de Senha',
      html: `
        <h2>Teste de Configuração</h2>
        <p>Se você recebeu este email, significa que as configurações de email estão funcionando corretamente!</p>
        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p><strong>Host:</strong> ${process.env.MAIL_HOST}</p>
        <p><strong>Porta:</strong> ${process.env.MAIL_PORT || '587'}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Este é um email de teste do sistema de recuperação de senha.
        </p>
      `
    };
    
    console.log('Enviando email de teste...');
    await SendMail(testEmail);
    console.log('✅ Email de teste enviado com sucesso!');
    console.log('Verifique sua caixa de entrada.');
    
  } catch (error) {
    console.error('❌ Erro ao enviar email de teste:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.error('\n💡 Dica: Para Gmail, você precisa usar uma "Senha de App" em vez da senha normal.');
      console.error('1. Ative a verificação em duas etapas na sua conta Google');
      console.error('2. Vá em "Segurança" > "Senhas de app"');
      console.error('3. Gere uma senha de app para este sistema');
      console.error('4. Use essa senha na variável MAIL_PASS');
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Dica: Verifique se o host e porta estão corretos.');
      console.error('Para Gmail: smtp.gmail.com:587');
      console.error('Para Outlook: smtp-mail.outlook.com:587');
    }
  }
}

testEmail(); 