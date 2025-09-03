function createViewWithCalculatedPositions() {
    console.show();
    console.clear();
    console.log("> Création d'une vue avec calcul des positions en tableau...");

    try {
        // Récupérer les éléments du modèle
        var modelElements = $("*").not("folder").not("archimate-diagram-model");
        if (modelElements.length === 0) {
            throw new Error("Aucun élément valide trouvé dans le modèle.");
        }

        // Créer la vue
        var newView = model.createArchimateView("Vue Calculée (Grille)");

        // Paramètres de placement
        var grid = 20;
        var cell = { width: 200, height: 80 };

        var devices = [];
        var businessFunctions = [];
        var applications = [];
        var relations = {};

        // Classer les éléments
        for (var element of modelElements) {
            var type = element.type.toLowerCase();
            if (type === "device") {
                devices.push(element);
            } else if (type === "business-function") {
                businessFunctions.push(element);
            } else if (type.startsWith("application")) {
                applications.push(element);
            }

            relations[element.id] = element.connected || [];
        }

        // Placer les devices
        var devicePositions = {};
        for (var i = 0; i < devices.length; i++) {
            var x = 0;
            var y = (i + 1) * (cell.height + grid);
            newView.add(devices[i], x, y, cell.width, cell.height);
            devicePositions[devices[i].id] = { row: i };
        }

        // Placer les fonctions métier
        var businessPositions = {};
        for (var j = 0; j < businessFunctions.length; j++) {
            var x = (j + 1) * (cell.width + grid);
            var y = 0;
            newView.add(businessFunctions[j], x, y, cell.width, cell.height);
            businessPositions[businessFunctions[j].id] = { col: j };
        }

        // Placer les applications à l'intersection des devices et business functions
        for (var app of applications) {
            var linkedDevices = relations[app.id].filter(e => e.type.toLowerCase() === "device");
            var linkedFunctions = relations[app.id].filter(e => e.type.toLowerCase() === "business-function");

            if (linkedDevices.length > 0 && linkedFunctions.length > 0) {
                for (var d of linkedDevices) {
                    for (var f of linkedFunctions) {
                        var row = devicePositions[d.id]?.row;
                        var col = businessPositions[f.id]?.col;

                        if (row !== undefined && col !== undefined) {
                            var x = (col + 1) * (cell.width + grid);
                            var y = (row + 1) * (cell.height + grid);
                            newView.add(app, x, y, cell.width, cell.height);
                            console.log(`📦 App placée : ${app.name} à col ${col}, row ${row}`);
                            break;
                        }
                    }
                }
            } else {
                console.log("⚠ Application sans relation détectée : " + app.name);
            }
        }

        // 👉 Création des relations (ancienne version avec deux types)
        createRelations(devices, businessFunctions, applications);

        console.log("> Vue créée avec succès !");
    } catch (e) {
        console.error("> Erreur : " + e.message);
    }
}

// Ancienne fonction de relation (assignment + realization)
function createRelations(devices, businessFunctions, applications) {
    console.log("> Création des relations...");

    try {
        // Devices ➝ Applications (assignment)
        for (var device of devices) {
            var linkedApplications = device.connected.filter(e => e.type.toLowerCase().startsWith("application"));
            for (var app of linkedApplications) {
                console.log(`🔗 Création de la relation assignment entre ${device.name} et ${app.name}`);
                device.createRelation(app, "assignment");
            }
        }

        // BusinessFunction ➝ Applications (realization)
        for (var businessFunction of businessFunctions) {
            var linkedApplications = businessFunction.connected.filter(e => e.type.toLowerCase().startsWith("application"));
            for (var app of linkedApplications) {
                console.log(`🔗 Création de la relation realization entre ${businessFunction.name} et ${app.name}`);
                businessFunction.createRelation(app, "realization");
            }
        }

        console.log("> Relations créées avec succès !");
    } catch (e) {
        console.error("> Erreur lors de la création des relations : " + e.message);
    }
}

// Lancement
createViewWithCalculatedPositions();
