from app.main import create_app
from app.config.settings import settings

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=settings.FLASK_PORT, debug=settings.FLASK_DEBUG)
