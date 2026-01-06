import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BOT_TOKEN = process.env.BOT_TOKEN!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://topgearmoscow-bot.vercel.app';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: TelegramUser;
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}

// Отправка сообщения
async function sendMessage(chatId: number, text: string, replyMarkup?: object) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
  };
  
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  return response.json();
}

// Регистрация пользователя
async function registerUser(user: TelegramUser) {
  try {
    const { error } = await supabase
      .from('bot_users')
      .upsert({
        telegram_id: user.id,
        username: user.username || null,
        first_name: user.first_name,
        last_name: user.last_name || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'telegram_id',
      });
    
    if (error) {
      console.error('Error registering user:', error);
    } else {
      console.log('User registered:', user.id);
    }
  } catch (e) {
    console.error('Exception registering user:', e);
  }
}

// POST - обработка webhook от Telegram
export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    
    console.log('Webhook received:', JSON.stringify(update, null, 2));
    
    if (!update.message) {
      return NextResponse.json({ ok: true });
    }
    
    const { message } = update;
    const chatId = message.chat.id;
    const text = message.text || '';
    const user = message.from;
    
    // Регистрируем пользователя
    await registerUser(user);
    
    // /start
    if (text === '/start' || text.startsWith('/start ')) {
      const welcomeText = `
🏎 <b>Добро пожаловать в TOPGEARMOSCOW!</b>

Мы — премиальный автосалон с широким выбором автомобилей.

✅ Проверка по всем базам
✅ Trade-in с выгодой
✅ Помощь в оформлении
✅ Гарантия на авто

Нажмите кнопку ниже, чтобы открыть каталог:
      `.trim();
      
      const keyboard = {
        inline_keyboard: [
          [{ text: '🚗 Открыть каталог', web_app: { url: APP_URL } }],
          [{ text: '📞 Связаться с нами', url: 'https://t.me/FixeR050' }]
        ]
      };
      
      await sendMessage(chatId, welcomeText, keyboard);
      return NextResponse.json({ ok: true });
    }
    
    // /help
    if (text === '/help') {
      await sendMessage(chatId, `
<b>Доступные команды:</b>

/start - Открыть каталог
/help - Показать помощь
/contact - Контакты
      `.trim());
      return NextResponse.json({ ok: true });
    }
    
    // /contact
    if (text === '/contact') {
      await sendMessage(chatId, `
<b>📞 Наши контакты:</b>

Telegram: @FixeR050
Email: TopGearMoscow@gmail.com
Телефон: +7 980 679 0176
      `.trim());
      return NextResponse.json({ ok: true });
    }
    
    // Любое другое сообщение
    const keyboard = {
      inline_keyboard: [
        [{ text: '🚗 Открыть каталог', web_app: { url: APP_URL } }]
      ]
    };
    
    await sendMessage(chatId, 'Нажмите кнопку ниже:', keyboard);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}

// GET - проверка что webhook работает
export async function GET() {
  return NextResponse.json({ 
    status: 'Webhook is active',
    timestamp: new Date().toISOString()
  });
}
