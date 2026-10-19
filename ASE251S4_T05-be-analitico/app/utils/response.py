from flask import jsonify

def success_response(data, message="OK", status_code=200):
    return jsonify({
        "success": True,
        "message": message,
        "data": data
    }), status_code

def error_response(message, status_code=400):
    return jsonify({
        "success": False,
        "message": message
    }), status_code
