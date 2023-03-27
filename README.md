# PDF Tools

## Run

```
docker run -p 4321:1234 eeriksen/pdf-tools
```

##### Variables

```
ACCESS_KEY (default "1234")
PORT (default "1234)
```

## HTML to PDF

`localhost:1234/html-to-pdf?access_key=1234&url=https://...`

##### Parameters

```
url
format = "A4"
landscape = false
background = false
scale = 1
event = null
margin = 0
access_key = null
```
