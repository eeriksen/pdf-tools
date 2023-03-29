# PDF Tools

## Run

```
docker run -p 4321:1234 eeriksen/pdf-tools
```

##### Variables

```
PORT (default "1234)
```

## HTML to PDF

`localhost:1234/html-to-pdf?url=https://...`

##### Parameters

```
url
format = "A4"
landscape = false
background = false
scale = 1
event = null
margin = 0
lang = "en"
```
