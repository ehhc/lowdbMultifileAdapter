# lowdbMultifileAdapter
Adapter for [lowdb](https://github.com/typicode/lowdb) that writes collections into separate files

## Usage
```
const adapter = new FileSync('folder', [fileExtension], [options])
const db = low(adapter)
```

### Options
- The first parameter is the folder the adapter saves the files to. It is required.
- Second parameter is the file extension of the files to be saved and read. Is optional and defaults to `json`
- Third parameter is the same as for other lowdb-adapters as well. Object containing the default values, serializer and deserializer function

### Note
You can customize the name of the array files by including a "id"-property.
If such a property is present in an object in an array, the resulting name will be:
`<arrayName>__<idValue>.<fileExtension>`

## Example
```
{
    posts: [
        {"title": "x"},
        {"title": "y"},
        {"title": "z"},
    ], 
    point: 1, 
    book: {
        "author": "x", 
        "content": "1"
    }
}
```

Should result in six files: 
- `posts__0.json`
- `posts__1.json`
- `posts__2.json`
- `point.json`
- `book.json`

