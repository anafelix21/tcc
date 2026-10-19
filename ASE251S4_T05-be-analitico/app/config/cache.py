from flask_caching import Cache

# Cache simple en memoria para optimizar lecturas analíticas pesadas
cache = Cache(config={
    'CACHE_TYPE': 'SimpleCache',
    'CACHE_DEFAULT_TIMEOUT': 60 # 60 segundos de expiración por defecto
})
