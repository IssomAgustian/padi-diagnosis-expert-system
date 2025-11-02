"""
Custom error classes for the application
"""


class BaseError(Exception):
    """Base error class"""
    def __init__(self, message, status_code=500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class ValidationError(BaseError):
    """Validation error for invalid input"""
    def __init__(self, message):
        super().__init__(message, 400)


class AuthenticationError(BaseError):
    """Authentication error"""
    def __init__(self, message):
        super().__init__(message, 401)


class AuthorizationError(BaseError):
    """Authorization error"""
    def __init__(self, message):
        super().__init__(message, 403)


class NotFoundError(BaseError):
    """Resource not found error"""
    def __init__(self, message):
        super().__init__(message, 404)


class ConflictError(BaseError):
    """Resource conflict error"""
    def __init__(self, message):
        super().__init__(message, 409)


class AIServiceError(BaseError):
    """AI service error"""
    def __init__(self, message):
        super().__init__(message, 502)


class DatabaseError(BaseError):
    """Database operation error"""
    def __init__(self, message):
        super().__init__(message, 500)


class ExternalServiceError(BaseError):
    """External service error"""
    def __init__(self, message):
        super().__init__(message, 502)