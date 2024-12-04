const express = require('express');
const si = require('systeminformation');
const path = require('path');
const os = require('os');

const app = express();

// Servir les fichiers statiques pour le style
app.use(express.static(path.join(__dirname, 'public')));

// Route principale pour afficher les métriques
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API pour récupérer les métriques système
app.get('/metrics', async (req, res) => {
    try {
        const cpu = await si.currentLoad();
        const mem = await si.mem();
        const disk = await si.fsSize();

        // Calculer les valeurs en Go et structurer les données
        const memoryUsedGB = (mem.active / 1024 / 1024 / 1024).toFixed(2); // en Go
        const totalMemoryGB = (mem.total / 1024 / 1024 / 1024).toFixed(2); // en Go
        const diskUsage = disk.map(d => ({
            mount: d.mount,
            used: (d.used / 1024 / 1024 / 1024).toFixed(2), // en Go
            total: (d.size / 1024 / 1024 / 1024).toFixed(2), // en Go
            usage: ((d.used / d.size) * 100).toFixed(2) // en pourcentage
        }));

        // Renvoi des données au front-end
        res.json({
            cpuLoad: cpu.currentLoad.toFixed(2) + '%',
            memoryUsedMB: memoryUsedGB + ' Go', // affichage en Go
            totalMemoryMB: totalMemoryGB + ' Go', // affichage en Go
            memoryUsagePercentage: ((mem.active / mem.total) * 100).toFixed(2) + '%',
            disk: diskUsage
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des données système.' });
    }
});

// Nouvelle route pour afficher les informations sur l'OS installé
app.get('/os-info', async (req, res) => {
    try {
        const osData = await si.osInfo();
        const osInfo = {
            osName: osData.distro,  // Nom de la distribution (Debian, Ubuntu, etc.)
            osVersion: osData.release,  // Version de la distribution
            arch: osData.arch  // Architecture (x64, arm64, etc.)
        };
        res.json(osInfo);
    } catch (error) {
        console.error('Erreur de récupération des informations de l\'OS:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des informations de l\'OS' });
    }
});

// Démarrage de l'application
app.listen(3000, () => {
    console.log('Monitoring app running on http://localhost:3000');
});
