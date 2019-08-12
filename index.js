const fs = require('graceful-fs');
const readFile = fs.readFileSync;
const writeFile = fs.writeFileSync;
const path = require('path');

class MultiFileSync {
    constructor(
        source,
        fileExtension = 'json',
        { defaultValue = {}, serialize = JSON.stringify, deserialize = JSON.parse } = {}
    ) {
        this.source = source;
        this.fileExtension = fileExtension;
        this.defaultValue = defaultValue;
        this.serialize = serialize;
        this.deserialize = deserialize
    }

    read() {
        let that = this;
        function readSingleFile(path) {
            try {
                const data = readFile(path, 'utf-8').trim();
                return data ? that.deserialize(data) : {}
            } catch (e) {
                if (e instanceof SyntaxError) {
                    e.message = `Malformed JSON in file: ${that.source}\n${e.message}`
                }
                throw e
            }
        }

        if (fs.existsSync(that.source)) {
            let files = fs.readdirSync(this.source);
            if (!files.length) {
                return this.defaultValue
            } else {
                let result = {};
                files.forEach(function(filename) {
                    if (filename.endsWith(that.fileExtension)) {
                        if (filename.includes('__')) {
                            const arrayName = filename.split('__')[0];
                            if (result[arrayName] === undefined) {
                                result[arrayName] = []
                            }
                            result[arrayName].push(
                                readSingleFile(path.join(that.source, filename))
                            )
                        } else {
                            result[path.parse(filename).name] = readSingleFile(
                                path.join(that.source, filename)
                            )
                        }
                    }
                });
                return result
            }
        }
        return this.defaultValue
    }

    write(data) {
        if (!fs.existsSync(this.source)) {
            throw Error('source does not exists')
        }
        if (!fs.lstatSync(this.source).isDirectory()) {
            throw Error('source is not a folder')
        }
        let files = fs.readdirSync(this.source);
        let that = this;
        files.forEach(function(filename) {
            if (filename.endsWith(that.fileExtension)) {
                fs.unlinkSync(path.join(that.source, filename))
            }
        });
        if (data !== undefined) {
            for (let [key, value] of Object.entries(data)) {
                if (Array.isArray(value)) {
                    Object.entries(value).forEach(([, value], index) => {
                        let fileDiscriminator = index;
                        if (value.id !== undefined) {
                            fileDiscriminator = value.id
                        }
                        writeFile(
                            path.join(
                                this.source,
                                key + '__' + fileDiscriminator + '.' + this.fileExtension
                            ),
                            this.serialize(value)
                        )
                    })
                } else {
                    writeFile(
                        path.join(this.source, key + '.' + this.fileExtension),
                        this.serialize(value)
                    )
                }
            }
        }
        return true
    }
}

module.exports = MultiFileSync;
