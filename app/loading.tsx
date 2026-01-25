export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-tg-bg">
      <div className="text-center space-y-6">
        {/* DTM Логотип с анимацией */}
        <div className="animate-pulse">
          <h1 className="text-6xl font-bold brand-name text-tg-accent tracking-[0.3em]">
            DTM
          </h1>
          <div className="text-sm font-semibold tracking-[0.3em] text-tg-white uppercase mt-3">
            dtm.moscow
          </div>
        </div>

        {/* Загрузочный индикатор */}
        <div className="flex gap-2 justify-center">
          <div className="w-3 h-3 bg-tg-accent rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-tg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-tg-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* Текст загрузки */}
        <p className="text-sm text-tg-hint uppercase tracking-wider">
          Загрузка...
        </p>
      </div>
    </div>
  );
}
