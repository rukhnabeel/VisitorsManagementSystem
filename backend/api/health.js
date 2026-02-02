module.exports = (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Direct API function is working',
        timestamp: new Date().toISOString()
    });
};
