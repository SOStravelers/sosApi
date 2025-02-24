const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    _id: String, // Guardamos un único documento con ID fijo
    data: Object, // Aquí irá la sesión de WhatsApp
});

module.exports = mongoose.model('Session', sessionSchema);