// 自定义错误体系
// type 字段用于：1) errorHandler 决定响应；2) 写入 error_logs 表用于监控分类
class AppError extends Error {
    constructor(message, { type, status = 500, cause } = {}) {
        super(message);
        this.name = this.constructor.name;
        this.type = type || 'unknown';
        this.status = status;
        if (cause) this.cause = cause;
    }
}

class ValidationError extends AppError {
    constructor(message, opts = {}) {
        super(message, { type: 'validation', status: 400, ...opts });
    }
}

class StockApiError extends AppError {
    constructor(message, opts = {}) {
        super(message, { type: 'stock_api', status: 502, ...opts });
    }
}

class LLMError extends AppError {
    constructor(message, opts = {}) {
        super(message, { type: 'llm', status: 502, ...opts });
    }
}

class JSONParseError extends AppError {
    constructor(message, opts = {}) {
        super(message, { type: 'json_parse', status: 502, ...opts });
    }
}

class SupabaseError extends AppError {
    constructor(message, opts = {}) {
        super(message, { type: 'supabase', status: 500, ...opts });
    }
}

module.exports = {
    AppError,
    ValidationError,
    StockApiError,
    LLMError,
    JSONParseError,
    SupabaseError,
};
