import { fabric } from 'fabric'

function createCustomControls() {
	return
	// const deleteIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAABmJLR0QA/wD/AP+gvaeTAAACkklEQVRIiZ3Wz4tWdRTH8ddEPzQ10jAps5iFI6FRaW0yBCFXEUTUrgiqv6C0XNfCWqr9oF1E0C4sI5rGRzMSitZmU/SDJKgGasYhonKeT4v7vczt6Xnuc50LB+69557z5vz4nnMnjLnCNjyIfdiMLUV1Hj9hBscmmB3naxTgrtAL6Shnwu5LAVwRXg39S4DU0p/j9dU8hCvbIBvCqRUAEnKMXE1uY/4qPhgKK5GcXCnkL7KOvEQeqGALa3m49n9Zg3UYezvneOD6EJP4FPfiW675nvsGo7l7hTVJyGmyhqgiybqSxuJzVxPUKWVnyBvk7AjIGvJeSWPDbqaG3NoF8ji5juwhq8gT5P0ByMej7bcJB8dBemQj+bU8/0h2FUANOd3u44Bwog3yD9lHDo5IF3J8fEY+Er4eVPxO3iRPkpvJ7WR+RE3uIY+NB30lLDZfHi4OdpKnybslqrNk/5Ca/EzWktl20KJwoX7xIrmBnBr48EJpBIYXfjd5ux20IMyGzJHV5LMhH37ZgCAHGro5cq2qYVpA54SZkGky1VD+Qr4r90vk/gLZWMC/kWfJ9eQR0m8HTQvPpUSyqWHwPLmxkfslco4sqg7kdlU3To+HJOwXttZtvMlyq14kjw7AanmH3FJsxgBqmaqnQy/kFTJJFobAfmgYPkOe6g6Zac66O8JSvzjeS/5swF6wPBVC7iRvdYP8d6gW2MspgD0FtjDE+KTq3Mx3Ax353z5Jtfh6IX+oltekanDWxf5cdc6OdoN8klHrPKxPWRl98hrZrGrhKdU5O9QN0gvrWzdliexoyW/+Jl+opkWHdC2FI+HyVsgAcEc43rGzkurg7xzlb6IDcKvlH8gtuKmozhc5ofqB/KbNz796mapkf3YLsAAAAABJRU5ErkJggg=="
	// let deleteImg = document.createElement('img');
	// deleteImg.src = deleteIcon;

	// function renderIcon(icon, size, ctx, left, top, fabricObject) {
	// 	ctx.save();
	// 	ctx.translate(left, top);
	// 	ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
	// 	ctx.drawImage(icon, -size / 2, -size / 2, size, size);
	// 	ctx.restore();
	// }


	// fabric.Object.prototype.controls.linearGradControl = new fabric.Control({
	// 	x: 0,
	// 	y: 0,
	// 	cursorStyle: 'pointer',
	// 	sizeX: 10,
	// 	touchSizeX: 10,
	// 	sizeY: 10,
	// 	touchSizeY: 10,
	// 	actionHandler: (evt, tar, x, y) => {
	// 		console.log('linearGradControl', {
	// 			evt, tar, x, y
	// 		})
	// 	},
	// 	render: (ctx, left, top, styleOverride, fabricObject) => {
	// 		const c = fabricObject.controls['linearGradControl']
	// 		ctx.save();
	// 		ctx.translate(left, top)
	// 		ctx.moveTo(c.offsetX, c.offsetY)
	// 		ctx.lineTo(c.offsetX + c.sizeX, c.offsetY + c.sizeY)
	// 		ctx.strokeStyle = 'white'
	// 		ctx.lineWidth = 1
	// 		ctx.stroke()
	// 		ctx.strokeRect(c.offsetX, c.offsetY, c.sizeX, c.sizeY)
	// 		ctx.restore()
	// 	},
	// 	handlePositionUpdated(fabricObject) {
	// 		console.log('handlePositionUpdated', this)
	// 		this.control1 = this.control1 || fabricObject.controls['xy1GradientControl']
	// 		this.control2 = this.control2 || fabricObject.controls['xy2GradientControl']
	// 		const surfaceWidth = this.control2.offsetX - this.control1.offsetX
	// 		const surfaceHeight = this.control2.offsetY - this.control1.offsetY

	// 		this.offsetX = this.control1.offsetX / 2
	// 		this.offsetY = this.control1.offsetY / 2
	// 		this.sizeX = surfaceWidth
	// 		this.touchSizeX = surfaceWidth
	// 		this.sizeY = surfaceHeight
	// 		this.touchSizeY = surfaceHeight
	// 	}
	// })

	// fabric.Object.prototype.refreshGradientAngleControls = function () {
	// 	this.controls.xy1GradientControl.offsetX = (this.fill?.coords?.x1 - this.width / 2)
	// 	this.controls.xy1GradientControl.offsetY = (this.fill?.coords?.y1 - this.height / 2)
	// 	this.controls.xy2GradientControl.offsetX = (this.fill?.coords?.x2 - this.width / 2)
	// 	this.controls.xy2GradientControl.offsetY = (this.fill?.coords?.y2 - this.height / 2)
	// 	this.controls.xy2GradientControl.setVisibility(true) //otherwise the render function doesn't run
	// }

	const xy1GradientControl = new fabric.Control({
		x: 0,
		y: 0,
		cursorStyle: 'pointer',
		actionName: "gradientSkew",
		cornerSize: 24,
		actionHandler: (evt, tar, x, y) => {
			if (evt.type === "mousemove") {
				const fabricObject = tar.target
				const thisControl = fabricObject.controls['xy1GradientControl']
				const lineearGradControl = fabricObject.controls['linearGradControl']
				// Update control position
				thisControl.offsetX = (x - fabricObject.left - fabricObject.width / 2)
				thisControl.offsetY = (y - fabricObject.top - fabricObject.height / 2)
				// Update live grad position

				fabricObject.fill.coords.x1 = x - fabricObject.left
				fabricObject.fill.coords.y1 = y - fabricObject.top
				// fabricObject.set({ dirty: true })

				// Update the linear control size
				// lineearGradControl.handlePositionUpdated(fabricObject)
				if (fabricObject.fill?.type === "radial") {
					fabricObject.fill.coords.x2 = x - fabricObject.left
					fabricObject.fill.coords.y2 = y - fabricObject.top
				}
				fabricObject.canvas.requestRenderAll()
				fabricObject.radialModified = true
			}
		},
		mouseUpHandler: (evt, tar, x, y) => {
			const selection = tar.target
			if (selection.radialModified) {
				delete selection.radialModified
				selection.canvas.fire("custom:object:modify", {
					target: selection,
					settings: { fill: selection.fill },
					action: tar.action
				})
			}
		},
		render: (ctx, left, top, styleOverride, fabricObject) => {
			if (fabricObject.fill?.type === "linear" || fabricObject.fill?.type === "radial") {
				renderIcon(deleteImg, 20, ctx, left, top, fabricObject)
			}
		}
	})

	fabric.Object.prototype.controls.xy1GradientControl = xy1GradientControl
	fabric.Textbox.prototype.controls.xy1GradientControl = xy1GradientControl

	const xy2GradientControl = new fabric.Control({
		x: 0,
		y: 0,
		cursorStyle: 'pointer',
		actionName: "gradientSkew",
		cornerSize: 24,
		actionHandler: (evt, tar, x, y) => {
			if (evt.type === "mousemove") {
				const selection = tar.target
				selection.controls.xy2GradientControl.offsetX = x - selection.left - selection.width / 2
				selection.controls.xy2GradientControl.offsetY = y - selection.top - selection.height / 2
				selection.fill.coords.x2 = x - selection.left
				selection.fill.coords.y2 = y - selection.top
				selection.canvas.requestRenderAll()
				selection.radialModified = true
			}
		},
		mouseUpHandler: (evt, tar, x, y) => {
			const selection = tar.target
			if (selection.radialModified) {
				delete selection.radialModified
				selection.canvas.fire("custom:object:modify", {
					target: selection,
					settings: { fill: selection.fill },
					action: tar.action
				})
			}
		},
		render: (ctx, left, top, styleOverride, fabricObject) => {
			if (fabricObject.fill?.type === "linear") {
				fabricObject.controls.xy2GradientControl.setVisibility(true)
				renderIcon(deleteImg, 20, ctx, left, top, fabricObject)
			} else if (fabricObject.fill?.type === "radial") {
				fabricObject.controls.xy2GradientControl.setVisibility(false)
			}
		}
	})
	fabric.Object.prototype.controls.xy2GradientControl = xy2GradientControl
	fabric.Textbox.prototype.controls.xy2GradientControl = xy2GradientControl
}


export {
	createCustomControls
}