import { fabric } from 'fabric'

var deleteIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAABmJLR0QA/wD/AP+gvaeTAAACkklEQVRIiZ3Wz4tWdRTH8ddEPzQ10jAps5iFI6FRaW0yBCFXEUTUrgiqv6C0XNfCWqr9oF1E0C4sI5rGRzMSitZmU/SDJKgGasYhonKeT4v7vczt6Xnuc50LB+69557z5vz4nnMnjLnCNjyIfdiMLUV1Hj9hBscmmB3naxTgrtAL6Shnwu5LAVwRXg39S4DU0p/j9dU8hCvbIBvCqRUAEnKMXE1uY/4qPhgKK5GcXCnkL7KOvEQeqGALa3m49n9Zg3UYezvneOD6EJP4FPfiW675nvsGo7l7hTVJyGmyhqgiybqSxuJzVxPUKWVnyBvk7AjIGvJeSWPDbqaG3NoF8ji5juwhq8gT5P0ByMej7bcJB8dBemQj+bU8/0h2FUANOd3u44Bwog3yD9lHDo5IF3J8fEY+Er4eVPxO3iRPkpvJ7WR+RE3uIY+NB30lLDZfHi4OdpKnybslqrNk/5Ca/EzWktl20KJwoX7xIrmBnBr48EJpBIYXfjd5ux20IMyGzJHV5LMhH37ZgCAHGro5cq2qYVpA54SZkGky1VD+Qr4r90vk/gLZWMC/kWfJ9eQR0m8HTQvPpUSyqWHwPLmxkfslco4sqg7kdlU3To+HJOwXttZtvMlyq14kjw7AanmH3FJsxgBqmaqnQy/kFTJJFobAfmgYPkOe6g6Zac66O8JSvzjeS/5swF6wPBVC7iRvdYP8d6gW2MspgD0FtjDE+KTq3Mx3Ax353z5Jtfh6IX+oltekanDWxf5cdc6OdoN8klHrPKxPWRl98hrZrGrhKdU5O9QN0gvrWzdliexoyW/+Jl+opkWHdC2FI+HyVsgAcEc43rGzkurg7xzlb6IDcKvlH8gtuKmozhc5ofqB/KbNz796mapkf3YLsAAAAABJRU5ErkJggg=="
var img = document.createElement('img');
img.src = deleteIcon;

function renderIcon(icon) {
    return function renderIcon(ctx, left, top, styleOverride, fabricObject) {
        if (fabricObject.fill?.type === "linear" || fabricObject.fill?.type === "radial") {
            var size = this.cornerSize;
            ctx.save();
            ctx.translate(left, top);
            ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
            ctx.drawImage(img, -size / 2, -size / 2, size, size);
            ctx.restore();
        }
    }
  }

fabric.Object.prototype.controls.xy1GradientControl = new fabric.Control({
    x: 0,
    y: 0,
    cursorStyle: 'pointer',
    actionHandler: (evt, tar, x, y) => {
        const selection = tar.target.canvas.getActiveObject()
        fabric.Object.prototype.controls.xy1GradientControl.offsetX = x - selection.left - selection.width / 2
        fabric.Object.prototype.controls.xy1GradientControl.offsetY = y - selection.top - selection.height / 2
        selection.fill.coords.x1 = x - selection.left
        selection.fill.coords.y1 = y - selection.top
        tar.target.canvas.requestRenderAll()
    },
    cornerSize: 24,
    render: renderIcon(deleteIcon),
    actionName: "gradientSkew"
});

fabric.Object.prototype.controls.xy2GradientControl = new fabric.Control({
    x: 0,
    y: 0,
    cursorStyle: 'pointer',
    actionHandler: (evt, tar, x, y) => {
        const selection = tar.target.canvas.getActiveObject()
        fabric.Object.prototype.controls.xy2GradientControl.offsetX = x - selection.left - selection.width / 2
        fabric.Object.prototype.controls.xy2GradientControl.offsetY = y - selection.top - selection.height / 2
        selection.fill.coords.x2 = x - selection.left
        selection.fill.coords.y2 = y - selection.top
        tar.target.canvas.requestRenderAll()
    },
    cornerSize: 24,
    render: renderIcon(deleteIcon),
    actionName: "gradientSkew"
});