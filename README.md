# Node Packtpub Deals Downloader

Download today's **Deals of the Day** from Packtpub.

## How to Use

1. Run `npm install -g packt-deals-downloader`
2. To download, you can run `node-pt --user example@gmail.com --password yourpassword`
3. It will be downloaded to your current directory inside `downloads` directory

## Commands

```
Usage: node-pt [options] [command]


  Commands:

    download [options]   Download today's 'Deals of the Day' ebook
    fetch                Get today's free ebook data.

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

### Download

```
Usage: download [options]

  Download today's 'Deals of the Day' ebook

  Options:

    -h, --help                   output usage information
    -u, --user <email>           Your Packtpub registered email
    -p, --password <password>    Your Packtpub password
    -o, --outputDir <outputDir>  Output directory
    -f, --fileType [type]        Your desired file type for the ebook. Only pdf, epub, and mobi supported. Default is pdf. Example: pdf,mobi,epub

```

Example:

```
node-pt download -u your@email.com -p yourpassword -o /somewhere/only/we/know -f mobi,epub,pdf
```

### Get Today's Deals Data

Example:

```
node-pt fetch
```

## Preview
![alt_text](https://media.giphy.com/media/3og0IyuGfHPlah3ayA/giphy.gif "Node Packtpub")
