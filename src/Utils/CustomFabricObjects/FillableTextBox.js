import { fabric } from 'fabric'

export default function fillableTextBox() {
  if (fabric.FillableTextBox) return
  fabric.FillableTextBox = fabric.util.createClass(fabric.Textbox, {
    type: 'FillableTextBox',
    initialize: function (text, options) {
      this.pS = options?.paraStyles || []
      // If no custom paraStylesSettings are present set a default
      if (!options?.paraStylesSettings) {
        options.paraStylesSettings = {
          defaultParaStyle: 'd',
          paraStyles: { d: { styles: {} } }
        }
      }
      this.paraBottomPad = options?.paraBottomPad ?? 10
      this.callSuper('initialize', text, {
        ...options,
        ...options.paraStylesSettings.paraStyles[options.paraStylesSettings.defaultParaStyle].styles,
      })
      this.paraStylesSettings = options.paraStylesSettings
      this.engineDefaultTextStyle = {
        fontFamily: 'Helvetica Neue, Helvetica',
        fill: 'white',
        fontSize: 28
      }
      this.gpc = options.gpc
      this.cachedAutoGradHeight = null
      this.cachedAutoGradWidth = null
      this.lineFillablesCacheDict = {}
      this.initSuperScript()
      console.log(this.paraBottomPad)
    },
    initSuperScript: function () {
      this.styles = JSON.parse(JSON.stringify(this?.styles ?? {}))
      const schema = this.superscript
      Object.entries(this.styles)
        .forEach(([lineIndexString, lineCharStyles]) => {
          const lineIndex = parseInt(lineIndexString)
          Object.entries(lineCharStyles)
            .forEach(([charIndexString, charStyles]) => {
              // lineIndex, charIndex, charStyles 
              if (charStyles?.super) {
                const charIndex = parseInt(charIndexString)
                const fontSize = this.getValueOfPropertyAt(lineIndex, charIndex, 'fontSize')
                const dy = this.getValueOfPropertyAt(lineIndex, charIndex, 'deltaY')
                this.styles[lineIndex][charIndex]['super'] = undefined
                this.styles[lineIndex][charIndex]['fontSize'] = fontSize * schema.size
                this.styles[lineIndex][charIndex]['deltaY'] = dy + fontSize * schema.baseline
              }
            })
        })
    },
    calcTextHeight: function () {
      let lineHeight
      let height = 0
      let currentParaIndex = 0
      this.paraEndHeights = []
      const len = this._textLines.length
      for (var i = 0; i < len; i++) {
        if (this.lineParaIndexes[i] !== currentParaIndex) {
          height += this.paraBottomPad
          this.paraEndHeights.push(height)
          currentParaIndex = this.lineParaIndexes[i]
        }
        lineHeight = this.getHeightOfLine(i);
        const addLineHeight = (i === len - 1 ? lineHeight / this.lineHeight : lineHeight)
        height += addLineHeight
      }
      return height;
    },
    updateAutoGrads: function () {
      // Don't update unless the height has changed since the last autoGradInit
      if (this.height === this.cachedAutoGradHeight && this.width === this.cachedAutoGradWidth)
        return

      // Go thru the active paraStyles and replace the fill setting with the live autoGrad
      this.pS.forEach((paraStyleObj, paraIndex) => {
        const hasSetParaStyleKey = paraStyleObj?.key && this.paraStylesSettings.paraStyles?.[paraStyleObj.key]
          ? paraStyleObj.key
          : this.paraStylesSettings.defaultParaStyle
        const cachedSetParaStyleFillSettings = this.paraStylesSettings.paraStyles[hasSetParaStyleKey].styles.cachedFillSettings
        const setParaStyleFill = this.paraStylesSettings.paraStyles[hasSetParaStyleKey].styles.fill
        const checkFillSettingsForType = cachedSetParaStyleFillSettings || setParaStyleFill
        if (checkFillSettingsForType?.type === 'preset') {
          this.paraStylesSettings.paraStyles[hasSetParaStyleKey].styles.cachedFillSettings = checkFillSettingsForType
          const useAutoGradKey = checkFillSettingsForType.key
          this.paraStylesSettings.paraStyles[hasSetParaStyleKey].styles.fill = autoGrads[useAutoGradKey].call(this)
        }
      })
    },
    _renderTextCommon: function (ctx, method) {
      this.updateAutoGrads()
      ctx.save();
      const left = this._getLeftOffset()
      const top = this._getTopOffset()
      let currentParaIndex = 0
      let lineHeights = 0
      for (var i = 0, len = this._textLines.length; i < len; i++) {
        if (this.lineParaIndexes[i] !== currentParaIndex) {
          lineHeights += this.paraBottomPad
          currentParaIndex = this.lineParaIndexes[i]
        }
        const heightOfLine = this.getHeightOfLine(i)
        const maxHeight = heightOfLine / this.lineHeight
        const leftOffset = this._getLineLeftOffset(i)
        let lineTop = (top + lineHeights + maxHeight)
        this._renderTextLine(
          method,
          ctx,
          this._textLines[i],
          left + leftOffset,
          lineTop,
          i
        );
        lineHeights += heightOfLine
      }
      ctx.restore();
    },
    renderCursor: function (boundaries, ctx) {
      var cursorLocation = this.get2DCursorLocation(),
        lineIndex = cursorLocation.lineIndex,
        charIndex = cursorLocation.charIndex > 0 ? cursorLocation.charIndex - 1 : 0,
        charHeight = this.getValueOfPropertyAt(lineIndex, charIndex, 'fontSize'),
        multiplier = this.scaleX * this.canvas.getZoom(),
        cursorWidth = this.cursorWidth / multiplier,
        topOffset = boundaries.topOffset,
        dy = this.getValueOfPropertyAt(lineIndex, charIndex, 'deltaY');
      topOffset += (1 - this._fontSizeFraction) * this.getHeightOfLine(lineIndex) / this.lineHeight
        - charHeight * (1 - this._fontSizeFraction);
      const cursorParaIndex = this.lineParaIndexes[lineIndex]
      topOffset += (this.paraBottomPad * cursorParaIndex)

      if (this.inCompositionMode) {
        this.renderSelection(boundaries, ctx);
      }
      ctx.fillStyle = this.cursorColor || this.getValueOfPropertyAt(lineIndex, charIndex, 'fill');
      ctx.globalAlpha = this.__isMousedown ? 1 : this._currentCursorOpacity;
      ctx.fillRect(
        boundaries.left + boundaries.leftOffset - cursorWidth / 2,
        topOffset + boundaries.top + dy,
        cursorWidth,
        charHeight);
    },
    renderSelection: function (boundaries, ctx) {
      var selectionStart = this.inCompositionMode ? this.hiddenTextarea.selectionStart : this.selectionStart,
        selectionEnd = this.inCompositionMode ? this.hiddenTextarea.selectionEnd : this.selectionEnd,
        isJustify = this.textAlign.indexOf('justify') !== -1,
        start = this.get2DCursorLocation(selectionStart),
        end = this.get2DCursorLocation(selectionEnd),
        startLine = start.lineIndex,
        endLine = end.lineIndex,
        startChar = start.charIndex < 0 ? 0 : start.charIndex,
        endChar = end.charIndex < 0 ? 0 : end.charIndex;

      for (var i = startLine; i <= endLine; i++) {
        var lineOffset = this._getLineLeftOffset(i) || 0,
          lineHeight = this.getHeightOfLine(i),
          realLineHeight = 0, boxStart = 0, boxEnd = 0;

        if (i === startLine) {
          boxStart = this.__charBounds[startLine][startChar].left;
        }
        if (i >= startLine && i < endLine) {
          boxEnd = isJustify && !this.isEndOfWrapping(i) ? this.width : this.getLineWidth(i) || 5; // WTF is this 5?
        }
        else if (i === endLine) {
          if (endChar === 0) {
            boxEnd = this.__charBounds[endLine][endChar].left;
          }
          else {
            var charSpacing = this._getWidthOfCharSpacing();
            boxEnd = this.__charBounds[endLine][endChar - 1].left
              + this.__charBounds[endLine][endChar - 1].width - charSpacing;
          }
        }
        realLineHeight = lineHeight;
        if (this.lineHeight < 1 || (i === endLine && this.lineHeight > 1)) {
          lineHeight /= this.lineHeight;
        }
        var drawStart = boundaries.left + lineOffset + boxStart,
          drawWidth = boxEnd - boxStart,
          drawHeight = lineHeight, extraTop = 0;
        if (this.inCompositionMode) {
          ctx.fillStyle = this.compositionColor || 'black';
          drawHeight = 1;
          extraTop = lineHeight;
        }
        else {
          ctx.fillStyle = this.selectionColor;
        }
        if (this.direction === 'rtl') {
          drawStart = this.width - drawStart - drawWidth;
        }
        extraTop += (this.paraBottomPad * this.lineParaIndexes[i])
        ctx.fillRect(
          drawStart,
          boundaries.top + boundaries.topOffset + extraTop,
          drawWidth,
          drawHeight);
        boundaries.topOffset += realLineHeight;
      }
    },
    _renderTextLinesBackground: function (ctx) {
      this.fillableCoords = {}
      if (!this.textBackgroundColor && !this.styleHas('textBackgroundColor')) {
        return;
      }
      var heightOfLine,
        lineLeftOffset, originalFill = ctx.fillStyle,
        line, lastColor, lastFillableID, currentFillableID,
        leftOffset = this._getLeftOffset(),
        lineTopOffset = this._getTopOffset(),
        boxStart = 0, boxWidth = 0, charBox, currentColor, path = this.path,
        drawStart;

      for (var i = 0, len = this._textLines.length; i < len; i++) {
        heightOfLine = this.getHeightOfLine(i);
        if (!this.textBackgroundColor && !this.styleHas('textBackgroundColor', i)) {
          lineTopOffset += heightOfLine;
          continue;
        }
        line = this._textLines[i];
        lineLeftOffset = this._getLineLeftOffset(i);
        boxWidth = 0;
        boxStart = 0;
        lastColor = this.getValueOfPropertyAt(i, 0, 'textBackgroundColor');
        lastFillableID = this.getValueOfPropertyAt(i, 0, 'fillableID')
        for (var j = 0, jlen = line.length; j < jlen; j++) {
          charBox = this.__charBounds[i][j];
          currentColor = this.getValueOfPropertyAt(i, j, 'textBackgroundColor');
          currentFillableID = this.getValueOfPropertyAt(i, j, 'fillableID');
          if (path) {
            ctx.save();
            ctx.translate(charBox.renderLeft, charBox.renderTop);
            ctx.rotate(charBox.angle);
            ctx.fillStyle = currentColor;
            currentColor && ctx.fillRect(
              -charBox.width / 2,
              -heightOfLine / this.lineHeight * (1 - this._fontSizeFraction),
              charBox.width,
              heightOfLine / this.lineHeight
            );
            ctx.restore();
          }
          else if (currentColor !== lastColor) {
            drawStart = leftOffset + lineLeftOffset + boxStart;
            if (this.direction === 'rtl') {
              drawStart = this.width - drawStart - boxWidth;
            }
            ctx.fillStyle = lastColor;
            if (lastColor) {
              if (lastFillableID) {
                this.fillableCoords[lastFillableID] = this.fillableCoords?.[lastFillableID] ?? []
                this.fillableCoords[lastFillableID].push({
                  left: drawStart * this.scaleX,
                  top: (lineTopOffset + (this.paraBottomPad * this.lineParaIndexes[i])) * this.scaleY,
                  width: boxWidth,
                  height: heightOfLine / this.lineHeight
                })
              }
              ctx.fillRect(
                drawStart,
                lineTopOffset + (this.paraBottomPad * this.lineParaIndexes[i]),
                boxWidth,
                heightOfLine / this.lineHeight
              )
            }

            boxStart = charBox.left;
            boxWidth = charBox.width;
            lastColor = currentColor;
            lastFillableID = currentFillableID;
          }
          else {
            boxWidth += charBox.kernedWidth;
          }
        }
        if (currentColor && !path) {
          drawStart = leftOffset + lineLeftOffset + boxStart;
          if (this.direction === 'rtl') {
            drawStart = this.width - drawStart - boxWidth;
          }
          ctx.fillStyle = currentColor;
          if (currentFillableID) {
            this.fillableCoords[currentFillableID] = this.fillableCoords?.[currentFillableID] ?? []
            this.fillableCoords[currentFillableID].push({
              left: drawStart * this.scaleX,
              top: (lineTopOffset + (this.paraBottomPad * this.lineParaIndexes[i])) * this.scaleY,
              width: boxWidth,
              height: heightOfLine / this.lineHeight
            })
          }
          ctx.fillRect(
            drawStart,
            lineTopOffset + (this.paraBottomPad * this.lineParaIndexes[i]),
            boxWidth,
            heightOfLine / this.lineHeight
          );
        }
        lineTopOffset += heightOfLine;
      }
      ctx.fillStyle = originalFill;
      // if there is text background color no
      // other shadows should be casted
      this._removeShadow(ctx);
    },
    _wrapText: function (lines, desiredWidth) {
      if (!this?.pS?.length) {
        this.pS = []
        for (let i = 0; i < lines.length; i++) {
          this.pS.push({})
        }
      }
      this.lineParaIndexes = []
      var wrapped = [], i;
      this.isWrapping = true;
      for (i = 0; i < lines.length; i++) {
        this.currentWrappingParaIndex = i
        const wrapLineResults = this._wrapLine(lines[i], i, desiredWidth)
        for (let j = 0; j < wrapLineResults.length; j++) {
          this.lineParaIndexes.push(i)
        }
        wrapped = wrapped.concat(wrapLineResults)
      }
      this.isWrapping = false;
      return wrapped;
    },
    getHeightOfChar: function (line, _char) {
      return this.getCompleteStyleDeclaration(line, _char).fontSize
    },
    getCompleteStyleDeclaration: function (lineIndex, charIndex) {
      const useParaStyleObj = this.getParaStyleByLine(lineIndex)
      const useCharStyleObj = this._getStyleDeclaration(lineIndex, charIndex) || {}
      const style = {
        ...useParaStyleObj,
        ...useCharStyleObj
      }
      let styleObject = {}
      for (var i = 0; i < this._styleProperties.length; i++) {
        const prop = this._styleProperties[i]
        if (this.fontSizeModifier && prop === 'fontSize') {
          styleObject[prop] = typeof style[prop] === 'undefined' ? this[prop] - this.fontSizeModifier : style[prop] - this.fontSizeModifier
        } else {
          styleObject[prop] = typeof style[prop] === 'undefined' ? this[prop] : style[prop]
        }
      }
      return styleObject;
    },
    getParaStyleByLine: function (lineIndex) {
      const useParaIndex = this.lineParaIndexes[lineIndex] === undefined
        ? this.currentWrappingParaIndex
        : this.lineParaIndexes[lineIndex]

      const paraStyleObj = this.pS[useParaIndex]
      const hasSetParaStyleKey = paraStyleObj?.key || false
      const isDefault = (!hasSetParaStyleKey || hasSetParaStyleKey === this.paraStylesSettings.defaultParaStyle || !this.paraStylesSettings.paraStyles?.[hasSetParaStyleKey]?.styles)
      const useParaStyleObj = !isDefault ? this.paraStylesSettings.paraStyles[hasSetParaStyleKey].styles : {}
      return useParaStyleObj
    },
    _getLineLeftOffset: function (lineIndex) {
      this.textAlign = this.getParaStyleByLine(lineIndex)?.textAlign || this.paraStylesSettings.paraStyles[this.paraStylesSettings.defaultParaStyle]?.styles?.textAlign || 'left'
      return this.callSuper('_getLineLeftOffset', lineIndex)
    },
    initFillableCache: function (fillablesStructureObject) {
      const textObjLineFillablesDict = fillablesStructureObject?.[this.slotIndex]?.[this.slotObjIndex]
      if (!textObjLineFillablesDict || !this.text) return
      this.lineFillablesCacheDict = {}
      Object.entries(textObjLineFillablesDict)
        .forEach(
          ([lineIndexString, fillableDataObjectsArray]) => {
            const lineCharsArray = this._unwrappedTextLines[lineIndexString]
            let compilationArray = ['']
            let currCharIndex = 0
            fillableDataObjectsArray.forEach((fillableDataObject) => {
              const start = parseInt(fillableDataObject.start.lineCharIndex)
              const end = parseInt(fillableDataObject.end.lineCharIndex)
              // push all chars leading up to this fillable as a string to compilation
              while (currCharIndex < start) {
                compilationArray[compilationArray.length - 1] += lineCharsArray[currCharIndex]
                currCharIndex++
              }
              // Get the correct fillable text
              let correctText = ''
              while (currCharIndex <= end) {
                correctText += lineCharsArray[currCharIndex]
                currCharIndex++
              }
              // Push the object with the correct text into the compilation array
              compilationArray.push({ ...fillableDataObject, correctText })
              // prep push the next string section to the array
              compilationArray.push('')
            })
            // Push any remaining post fillable chars to the compilation array
            while (currCharIndex <= lineCharsArray.length - 1) {
              compilationArray[compilationArray.length - 1] += lineCharsArray[currCharIndex]
              currCharIndex++
            }
            this.lineFillablesCacheDict[lineIndexString] = compilationArray
          }
        )
    },
    updateFillableContents: function (useIncompleteFillableReplacementString, fillablesDataObject) {
      if (!Object.keys(this.lineFillablesCacheDict).length) {
        return this.text
      }
      let newTextString = ''
      this.styles = {}
      // let newLineStyles = {}
      this._unwrappedTextLines.forEach((lineCharsArray, lineIndex) => {
        if (!this.lineFillablesCacheDict?.[lineIndex]) {
          lineCharsArray.forEach(char => newTextString += char)
          if (lineIndex !== this._unwrappedTextLines.length - 1) newTextString += '\n'
        } else {
          let currLineCharIndex = 0

          this.lineFillablesCacheDict[lineIndex].forEach(compositeElement => {
            if (typeof compositeElement === 'string') {
              currLineCharIndex += compositeElement.length
              return newTextString += compositeElement
            }
            // Now we have a fillable gap let's check the state of the fillable object
            const fillableStateObject = fillablesDataObject[compositeElement.fillableID]
            const fillableCompositeObject = compositeElement
            if (!fillableStateObject?.fillableMode) {
              // Not active or complete, render add appropriate replacement and create hidden styles
              if (useIncompleteFillableReplacementString) {
                // has active replacement object so use that string 
                for (let i = 0; i < useIncompleteFillableReplacementString.length; i++) {
                  newTextString += useIncompleteFillableReplacementString[i]
                  this.updateLineCharStyles(lineIndex, currLineCharIndex, false, {
                    fillableID: compositeElement.fillableID,
                    textBackgroundColor: 'rgba(0, 0, 0, 0.75)'
                  })
                  currLineCharIndex++
                }
              } else {
                // No active replacement so hash the correct val to just 'o's to fake movement even on the correct answer
                for (let i = 0; i < fillableCompositeObject.correctText.length; i++) {
                  const currCorrectChar = fillableCompositeObject.correctText[i]
                  if (currCorrectChar === ' ') newTextString += ' '
                  else newTextString += 'o'
                  this.updateLineCharStyles(lineIndex, currLineCharIndex, false, {
                    fillableID: compositeElement.fillableID,
                    textBackgroundColor: 'rgba(0, 0, 0, 0.75)',
                  })
                  currLineCharIndex++
                }
              }
            } else if (fillableStateObject.fillableMode === 'complete') {
              // RENDER COMPLETE FILLABLE HERE
              for (let i = 0; i < fillableCompositeObject.correctText.length; i++) {
                newTextString += fillableCompositeObject.correctText[i]
                this.updateLineCharStyles(lineIndex, currLineCharIndex, true, {
                  fillableID: compositeElement.fillableID,
                  textBackgroundColor: 'rgba(0, 255, 0, 0.001)'
                })
                currLineCharIndex++
              }
            } else if (fillableStateObject.fillableMode === 'activeDrop') {
              for (let i = 0; i < useIncompleteFillableReplacementString.length; i++) {
                newTextString += useIncompleteFillableReplacementString[i]
                this.updateLineCharStyles(lineIndex, currLineCharIndex, true, {
                  fillableID: compositeElement.fillableID,
                  textBackgroundColor: 'rgba(0, 0, 0, 0.75)',
                })
                currLineCharIndex++
              }
            }
          })
          if (lineIndex !== this._unwrappedTextLines.length - 1) newTextString += '\n'
        }
      })
      // console.log({ newLineStyles })
      // this.styles = newLineStyles
      this.text = newTextString
      this.initDimensions()
    },
    updateLineCharStyles(lineIndex, charIndex, textVisible, addStyles) {
      this.styles[lineIndex] = this.styles?.[lineIndex] || {}
      this.styles[lineIndex][charIndex] = this.styles[lineIndex]?.[charIndex] || {}
      // Check for set charFill and cache it if it's not already been cached
      if (this.styles[lineIndex][charIndex].fill !== undefined) {
        if (this.styles[lineIndex][charIndex].cachedFill === undefined) {
          this.styles[lineIndex][charIndex].cachedFill = this.styles[lineIndex][charIndex].fill
        }
      }
      this.styles[lineIndex][charIndex] = {
        ...this.styles[lineIndex][charIndex],
        ...addStyles
      }
      if (!textVisible) {
        this.styles[lineIndex][charIndex].fill = null
      } else {
        if (this.styles[lineIndex][charIndex]?.cachedFill) {
          this.styles[lineIndex][charIndex].fill = this.styles[lineIndex][charIndex]?.cachedFill
        } else {
          delete this.styles[lineIndex][charIndex].fill
        }
      }
    }
  })
}

const autoGrads = {
  'brightInherit': function () {
    const { colorScale, colorScaleRange } = this.parentObject
    // const lum = 0.25
    const startColor = colorScale(colorScaleRange[0])//.luminance(lum)
    // const midColor = colorScale(colorScaleRange[0] + ((colorScaleRange[1] - colorScaleRange[0]) / 2))
    const endColor = colorScale(colorScaleRange[1])//.luminance(lum)
    return new fabric.Gradient({
      type: 'linear',
      coords: { x1: -896 * .25, y1: -504 * .25, x2: 896 * .25, y2: 504 * .25 },
      colorStops: [
        { offset: 0, color: startColor.css() },
        // { offset: 0.5, color: midColor.css() },
        { offset: 1, color: endColor.css() },
      ]
    })
  }
}