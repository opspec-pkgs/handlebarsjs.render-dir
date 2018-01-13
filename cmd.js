const handlebars = require('handlebars');
const data = require('/data.json');
const fs = require('fs');
const path = require('path');

/**
 * walks the file tree rooted at root, calling walkFn for each file or directory in the tree, including root
 * @param {String} absPath 
 * @param {Function(path, )} walkFn 
 */
const walk = (absPath, walkFn) => {
    fs.readdirSync(absPath).forEach(item => {
        const itemAbsPath = `${absPath}/${item}`;
        const itemStat = fs.statSync(itemAbsPath);

        walkFn(itemAbsPath, itemStat);        
        if (itemStat.isDirectory()) {
            walk(itemAbsPath, walkFn)
        }
    });
}

const ensureDirExists = (absPath) => {
    //check if folder needs to be created or integrated
    let absDirPath = path.basename(absPath);

    if (!fs.existsSync(absDirPath)) {
        fs.mkdirSync(absDirPath);
    }
}

/**
 * processes a single handlebars partial file
 * @param {*} absPath 
 */
const processPartialFile = (absPath) => {
    let partial = fs.readFileSync(absPath, 'utf8');
    const partialName = absPath.slice('/partials/'.length, absPath.length - (path.parse(absPath).ext).length);
    console.log(partialName);
    handlebars.registerPartial(partialName, partial);
};

/**
 * processes a single handlebars template file
 * @param {*} absPath 
 */
const processTemplateFile = (absPath) => {
    let template = fs.readFileSync(absPath, 'utf8');
    const hydratedTemplate = handlebars.compile(template)(data);
    const resultAbsPath = constructResultPath(absPath);
    ensureDirExists(resultAbsPath);
    fs.writeFileSync(resultAbsPath, hydratedTemplate);
};

/**
 * constructs a result path from a template file/dir
 * @param {*} absPath 
 */
const constructResultPath = (absPath) => {
    const resultPath = path.join('/result', absPath.slice('/templates'.length));
    return path.parse(resultPath).ext === '.hbs' 
    ? resultPath.slice(0, resultPath.length - '.hbs'.length)
    : resultPath;
}

walk('/partials', (absPath, stat) => {
    if(!stat.isDirectory()) {
        processPartialFile(absPath);
    }
});

walk('/templates', (absPath, stat) => {
    if(stat.isDirectory()) {
        // maintain empty dirs
        fs.mkdirSync(constructResultPath(absPath));
    } else {
        processTemplateFile(absPath);
    }
});