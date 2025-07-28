import Ticket from '../models/Ticket';
import User from '../models/User';
import { Op } from 'sequelize';
import { getIO } from '../libs/socket';
import { formatDistanceToNow } from 'date-fns';

export default async function notifyPendingTicketsJob() {
  // Busca todos os tickets pendentes
  const tickets = await Ticket.findAll({
    where: { status: 'pending' },
    include: [
      { model: User, as: 'user', attributes: ['id', 'name', 'email', 'companyId'] }
    ]
  });

  const io = getIO();

  for (const ticket of tickets) {
    if (!ticket.userId || !ticket.user) continue;
    // Calcula o tempo parado
    const tempoAguardando = formatDistanceToNow(ticket.updatedAt || ticket.createdAt, { addSuffix: true, locale: undefined });
    // Exemplo: 'há 12 minutos'

    // Monta mensagem
    const message = `O ticket #${ticket.id} está aguardando há ${tempoAguardando}`;

    // Envia notificação via WebSocket para o usuário responsável
    io.of(String(ticket.user.companyId)).to(`user-${ticket.userId}`).emit('ticket:pending:notification', {
      ticketId: ticket.id,
      message,
      tempoAguardando,
    });
  }
  console.log(`[notifyPendingTicketsJob] Notificações enviadas para ${tickets.length} tickets pendentes.`);
} 