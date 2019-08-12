const MultiFileSync = require('../index');
const fs = require('fs');
const tmp = require('tmp');
const path = require('path');
const rimraf = require("rimraf");

describe('MultiFileSync', () => {
    it('should read an existing directory', async () => {
        let normalNumber = 1;
        let complexObject = {prop1: "1", prop2: "2"};
        let arrayObjects = [
            {arrayProp1: "11", arrayProp2: "12"},
            {arrayProp1: "21", arrayProp2: "22"},
            {arrayProp1: "31", arrayProp2: "32"},
        ];

        let tempFolder = tmp.dirSync();
        fs.writeFileSync(path.join(tempFolder.name, 'normalnumber.json'), JSON.stringify(normalNumber), 'utf8');
        fs.writeFileSync(path.join(tempFolder.name, 'complexobject.json'), JSON.stringify(complexObject), 'utf8');
        fs.writeFileSync(path.join(tempFolder.name, 'arrayobjects__0.json'), JSON.stringify(arrayObjects[0]), 'utf8');
        fs.writeFileSync(path.join(tempFolder.name, 'arrayobjects__1.json'), JSON.stringify(arrayObjects[1]), 'utf8');
        fs.writeFileSync(path.join(tempFolder.name, 'arrayobjects__2.json'), JSON.stringify(arrayObjects[2]), 'utf8');

        const adapter = new MultiFileSync(tempFolder.name);
        let readDatabase = await adapter.read();
        expect(readDatabase).toMatchObject({
            normalnumber: 1,
            complexobject: complexObject,
            arrayobjects: arrayObjects
        });
        rimraf.sync(tempFolder.name);
    });
    it('makes sure, read ignores files with another file extension', async () => {
        let normalNumber = 1;
        let complexObject = {prop1: "1", prop2: "2"};

        let tempFolder = tmp.dirSync();
        fs.writeFileSync(path.join(tempFolder.name, 'normalnumber.other'), JSON.stringify(normalNumber), 'utf8');
        fs.writeFileSync(path.join(tempFolder.name, 'complexobject.json'), JSON.stringify(complexObject), 'utf8');

        const adapter = new MultiFileSync(tempFolder.name, 'other');
        let readDatabase = await adapter.read();
        expect(readDatabase).toMatchObject({
            normalnumber: 1,
        });
        rimraf.sync(tempFolder.name);
    });

    it('makes sure, read works with ids in file name for arrays', async () => {
        let arrayObjects = [
            {id : "complexId1", arrayProp1: "11", arrayProp2: "12"},
            {id : "complexId2", arrayProp1: "21", arrayProp2: "22"},
            {id : "complexId3", arrayProp1: "31", arrayProp2: "32"},
        ];

        let tempFolder = tmp.dirSync();
        fs.writeFileSync(path.join(tempFolder.name, 'arrayobjects__complexId1.json'), JSON.stringify(arrayObjects[0]), 'utf8');
        fs.writeFileSync(path.join(tempFolder.name, 'arrayobjects__complexId2.json'), JSON.stringify(arrayObjects[1]), 'utf8');
        fs.writeFileSync(path.join(tempFolder.name, 'arrayobjects__complexId3.json'), JSON.stringify(arrayObjects[2]), 'utf8');

        const adapter = new MultiFileSync(tempFolder.name);
        let readDatabase = await adapter.read();
        expect(readDatabase).toMatchObject({
            arrayobjects: arrayObjects
        });
        rimraf.sync(tempFolder.name);
    });

    it('makes sure, write works properly', async () => {
        let data = {
            normalnumber : 1,
            complexobject: {prop1: "1", prop2: "2"},
            array: [
                {arrayProp1: "11", arrayProp2: "12"},
                {arrayProp1: "21", arrayProp2: "22"},
                {arrayProp1: "31", arrayProp2: "32"},
            ]
        };
        let tempFolder = tmp.dirSync();

        const adapter = new MultiFileSync(tempFolder.name);
        await  adapter.write(data);
        expect(JSON.parse(fs.readFileSync(path.join(tempFolder.name, "normalnumber.json"), 'utf-8').trim())).toEqual(data.normalnumber);
        expect(JSON.parse(fs.readFileSync(path.join(tempFolder.name, "complexobject.json"), 'utf-8').trim())).toMatchObject(data.complexobject);
        expect(JSON.parse(fs.readFileSync(path.join(tempFolder.name, "array__0.json"), 'utf-8').trim())).toMatchObject(data.array[0]);
        expect(JSON.parse(fs.readFileSync(path.join(tempFolder.name, "array__1.json"), 'utf-8').trim())).toMatchObject(data.array[1]);
        expect(JSON.parse(fs.readFileSync(path.join(tempFolder.name, "array__2.json"), 'utf-8').trim())).toMatchObject(data.array[2]);
        rimraf.sync(tempFolder.name);
    });

    it('makes sure, write uses the given file extension', async () => {
        let data = {
            normalnumber : 1,
            complexobject: {prop1: "1", prop2: "2"},
            array: [
                {arrayProp1: "11", arrayProp2: "12"},
                {arrayProp1: "31", arrayProp2: "32"},
            ]
        };

        let tempFolder = tmp.dirSync();

        const adapter = new MultiFileSync(tempFolder.name, 'anotherExtension');
        await  adapter.write(data);
        expect(fs.existsSync(path.join(tempFolder.name, "normalnumber.anotherExtension"))).toBeTruthy();
        expect(fs.existsSync(path.join(tempFolder.name, "complexobject.anotherExtension"))).toBeTruthy();
        expect(fs.existsSync(path.join(tempFolder.name, "array__0.anotherExtension"))).toBeTruthy();
        expect(fs.existsSync(path.join(tempFolder.name, "array__1.anotherExtension"))).toBeTruthy();
        rimraf.sync(tempFolder.name);
    });

    it('makes sure, write uses the ids of objects in arrays for file name creation', async () => {
        let data = {
            array: [
                {id : "complexId1", arrayProp1: "11", arrayProp2: "12"},
                {id : "complexId2", arrayProp1: "21", arrayProp2: "22"},
                {id : "complexId3", arrayProp1: "31", arrayProp2: "32"},
            ]
        };
        let tempFolder = tmp.dirSync();

        const adapter = new MultiFileSync(tempFolder.name);
        await  adapter.write(data);
        expect(JSON.parse(fs.readFileSync(path.join(tempFolder.name, "array__complexId1.json"), 'utf-8').trim())).toMatchObject(data.array[0]);
        expect(JSON.parse(fs.readFileSync(path.join(tempFolder.name, "array__complexId2.json"), 'utf-8').trim())).toMatchObject(data.array[1]);
        expect(JSON.parse(fs.readFileSync(path.join(tempFolder.name, "array__complexId3.json"), 'utf-8').trim())).toMatchObject(data.array[2]);
        rimraf.sync(tempFolder.name);
    });

    it('makes sure, write deltes files with the same extension already present in the directory', async () => {
        let data = {
            array: [
                {id : "complexId1", arrayProp1: "11", arrayProp2: "12"},
                {id : "complexId2", arrayProp1: "21", arrayProp2: "22"},
                {id : "complexId3", arrayProp1: "31", arrayProp2: "32"},
            ]
        };
        let tempFolder = tmp.dirSync();

        fs.writeFileSync(path.join(tempFolder.name, 'alreadyPresentFile.json'), "alreadyPresentFilejson", 'utf8');
        fs.writeFileSync(path.join(tempFolder.name, 'alreadyPresentFile.other'), "alreadyPresentFileother", 'utf8');

        const adapter = new MultiFileSync(tempFolder.name);
        await  adapter.write(data);
        expect(JSON.parse(fs.readFileSync(path.join(tempFolder.name, "array__complexId1.json"), 'utf-8').trim())).toMatchObject(data.array[0]);
        expect(JSON.parse(fs.readFileSync(path.join(tempFolder.name, "array__complexId2.json"), 'utf-8').trim())).toMatchObject(data.array[1]);
        expect(JSON.parse(fs.readFileSync(path.join(tempFolder.name, "array__complexId3.json"), 'utf-8').trim())).toMatchObject(data.array[2]);
        expect(fs.readFileSync(path.join(tempFolder.name, "alreadyPresentFile.other"), 'utf-8').trim()).toEqual("alreadyPresentFileother");
        expect(fs.existsSync(path.join(tempFolder.name, "alreadyPresentFile.json"))).toBeFalsy();
        rimraf.sync(tempFolder.name);
    });

});
