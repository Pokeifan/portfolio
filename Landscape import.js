// 📌 Fonction pour traiter le fichier CSV et créer les éléments
function processCSV(filePath) {
    var file = new java.io.File(filePath);
    console.log("✔ Fichier sélectionné : " + filePath);

    var reader = new java.io.BufferedReader(new java.io.FileReader(file));
    var lines = [];
    var line;
    while ((line = reader.readLine()) !== null) {
        lines.push(line);
    }
    reader.close();

    if (lines.length < 2) {
        throw new Error("❌ Données CSV insuffisantes.");
    }

    var elements = [];
    var headers = lines[0].split(";");

    for (var i = 1; i < lines.length; i++) {
        var parts = lines[i].split(";");
        if (parts.length === headers.length) {
            var element = {
                Type: parts[0].trim().toLowerCase(),
                Name: parts[1].trim(),
                Servers: parts[2].trim(),
                Fonctions: parts[3].trim()
            };
            elements.push(element);
        }
    }

    console.log("✔ Fichier CSV chargé avec succès. " + elements.length + " entrées trouvées.");
    return elements;
}

// 📌 Étape 1 : Sélectionner le fichier CSV
var fileDialog = new java.awt.FileDialog(new java.awt.Frame(), "Sélectionner un fichier CSV", java.awt.FileDialog.LOAD);
fileDialog.setVisible(true);

var selectedFile = fileDialog.getFile();
if (!selectedFile) {
    throw new Error("❌ Opération annulée par l'utilisateur.");
}

var filePath = fileDialog.getDirectory() + selectedFile;

// 📌 Étape 2 : Traiter le CSV et créer les éléments
var elements = processCSV(filePath);
var elementMap = {}; // Pour retrouver facilement les éléments par nom

elements.forEach(function(el) {
    try {
        var createdElement;
        var elementType;

        switch (el.Type) {
            case "device":
                elementType = "device";
                break;
            case "businessfunction":
            case "business-function":
                elementType = "business-function";
                break;
            case "application":
            case "application-component":
                elementType = "application-component";
                break;
            default:
                console.error(`❌ Type inconnu : ${el.Type} pour l'élément ${el.Name}`);
                return;
        }

        console.log(`✔ Création de l'élément ${elementType} - ${el.Name}`);
        createdElement = model.createElement(elementType, el.Name);
        if (!createdElement) throw new Error("⚠ L'élément n'a pas pu être créé.");

        elementMap[el.Name] = createdElement;

    } catch (error) {
        console.error(`❌ Erreur lors de l'ajout de l'élément ${el.Type} - ${el.Name}`);
        console.error(error.message);
    }
});

// 📌 Étape 3 : Créer les relations pour les applications
elements.forEach(function(el) {
    if (el.Type === "application" || el.Type === "application-component") {
        var app = elementMap[el.Name];
        if (!app) return;

        // 🔗 Relations avec les devices
        if (el.Servers) {
            var serverNames = el.Servers.split(",").map(s => s.trim());
            serverNames.forEach(function(serverName) {
                var server = elementMap[serverName];
                if (server) {
                    console.log(`🔗 Assignment : ${server.name} ➜ ${app.name}`);
                    model.createRelationship(device, app, "realization", "");
                } else {
                    console.warn(`⚠ Serveur non trouvé : ${serverName}`);
                }
            });
        }

        // 🔗 Relations avec les fonctions métiers
        if (el.Fonctions) {
            var fonctionNames = el.Fonctions.split(",").map(f => f.trim());
            fonctionNames.forEach(function(fnName) {
                var fn = elementMap[fnName];
                if (fn) {
                    console.log(`🔗 Realization : ${fn.name} ➜ ${app.name}`);
                    model.createRelationship(device, app, "realization", "");
                } else {
                    console.warn(`⚠ Fonction non trouvée : ${fnName}`);
                }
            });
        }
    }
});

console.log("✔ Importation et relations terminées avec succès !");
