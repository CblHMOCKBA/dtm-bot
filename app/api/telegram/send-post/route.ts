import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { text, photo_url } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Текст поста обязателен' },
        { status: 400 }
      );
    }

    // Получаем токен бота из переменных окружения
    const BOT_TOKEN = process.env.BOT_TOKEN;
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: 'BOT_TOKEN не настроен' },
        { status: 500 }
      );
    }

    // Получаем всех активных пользователей
    const { data: users, error: dbError } = await supabase
      .from('bot_users')
      .select('telegram_id')
      .eq('is_active', true);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Ошибка базы данных' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: 0, failed: 0, message: 'Нет активных пользователей' },
        { status: 200 }
      );
    }

    // Отправляем пост всем пользователям
    let successCount = 0;
    let failedCount = 0;

    for (const user of users) {
      try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/${
          photo_url ? 'sendPhoto' : 'sendMessage'
        }`;

        const body = photo_url
          ? {
              chat_id: user.telegram_id,
              photo: photo_url,
              caption: text,
              parse_mode: 'HTML',
            }
          : {
              chat_id: user.telegram_id,
              text: text,
              parse_mode: 'HTML',
            };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          successCount++;
        } else {
          failedCount++;
          console.error(
            `Failed to send to user ${user.telegram_id}:`,
            await response.text()
          );
        }

        // Небольшая задержка между отправками (чтобы не словить rate limit)
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        failedCount++;
        console.error(`Error sending to user ${user.telegram_id}:`, error);
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      total: users.length,
    });
  } catch (error: any) {
    console.error('Error in send-post API:', error);
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
