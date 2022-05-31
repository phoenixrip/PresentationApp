import { fabric } from 'fabric'
import gsap from 'gsap'

function BodyTextbox() {
  if (fabric.BodyTextbox) return
  fabric.BodyTextbox = fabric.util.createClass(fabric.Textbox, {
    type: 'BodyTextbox',
    // projectParaStylesController is added to the prototype before
    // any of these objects are instantiated
    // so we have access to a live class in this init
    initialize: function (text, options) {
      // this.projectParaStylesController = options.fabricCanvas.projectParaStylesController
      this.pS = options?.pS || []
      this.defaultParaStyleKey = options?.defaultParaStyleKey || this.projectParaStylesController.defaultParaStyle
      this.defaultParaStyleOverrides = options?.defaultParaStyleOverrides || {}
      this.paraBottomPad = options?.paraBottomPad ?? 10
      this.callSuper('initialize', text, {
        ...options,
        cursorColor: 'white',
        ...this.projectParaStylesController.paraStyles[this.defaultParaStyleKey].styles,
        ...this.defaultParaStyleOverrides
      })
      this.gpc = options.gpc
      this.cachedAutoGradHeight = null
      this.cachedAutoGradWidth = null
      this.lineFillablesCacheDict = {}
      this.initSuperScript()

      this.getObjectInTimeline = inAnimations['default'].bind(this)

      // Only for editor mode
      this.__eventListeners['changed'] = this.__eventListeners?.['changed'] || []
      this.__eventListeners['changed'].push(this.handleTextChanged)
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
      let currentParaIndex = -1

      this.paraWrapperStartHeights = []
      this.paraContainerStartHeights = []
      this.paraStartHeights = []
      this.paraEndHeights = []
      this.paraMaxLineWidths = []
      this.paraMinLeftOffsets = []
      const len = this._textLines.length
      for (var i = 0; i < len; i++) {
        if (this.lineParaIndexes[i] !== currentParaIndex) {
          // Start of a new para
          this.paraStartHeights[currentParaIndex]
          height += this.getParaStyleByLine(i).paraTopMargin
          currentParaIndex = this.lineParaIndexes[i]
        }
        lineHeight = this.getHeightOfLine(i);
        const addLineHeight = (i === len - 1 ? lineHeight / this.lineHeight : lineHeight)
        height += addLineHeight
        if (this.lineParaIndexes[i + 1] !== currentParaIndex) {
          // End of a para
          // Add para bottom margin aslong as it's not the last para
          const isFinalLine = i === len - 1
          if (!isFinalLine) {
            height += this.getParaStyleByLine(i).paraBottomMargin
          }
          this.paraEndHeights.push(height)
        }
      }
      return height;
    },
    /**
     * @private
     * @param {CanvasRenderingContext2D} ctx Context to render on
     */
    _render: function (ctx) {
      var path = this.path;
      path && !path.isNotVisible() && path._render(ctx);
      this._setTextStyles(ctx);
      this._renderTextLinesBackground(ctx);
      this._renderTextDecoration(ctx, 'underline');
      this._renderText(ctx);
      this._renderTextDecoration(ctx, 'overline');
      this._renderTextDecoration(ctx, 'linethrough');
    },
    _renderTextCommon: function (ctx, method) {
      console.log('_renderTextCommon', method)
      ctx.save();
      const left = this._getLeftOffset()
      const top = this._getTopOffset()
      let currentParaIndex = -1
      let lineHeights = 0
      for (var i = 0, len = this._textLines.length; i < len; i++) {
        if (this.lineParaIndexes[i] !== currentParaIndex) {
          // Start of a new para
          if (method === 'fillText') {
            /* If the fill on the paraStyle for this new para is
            a gradient we need to update its coords to the
            coords of the para before filing */
            console.log(`
              starting fillText of para ${this.lineParaIndexes[i]}
              paraStartHeight = ${lineHeights}
              para end height = ${this.paraEndHeights[this.lineParaIndexes[i]]}
            `)
            console.log(this.__lineWidths)
          }
          lineHeights += this.getParaStyleByLine(i).paraTopMargin
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
        if (this.lineParaIndexes[i + 1] !== currentParaIndex) {
          // End of a para
          const isFinalLine = (i === this._textLines.length - 1)
          if (!isFinalLine) {
            lineHeights += this.getParaStyleByLine(i).paraBottomMargin
          }
        }
      }
      ctx.restore();
    },
    checkAllParaStylesForTextDecoration(type) {
      let hasType = false
      for (let i = 0; i < this.pS.length; i++) {
        if (this.getParaStyleByPara(i)[type] === true) hasType = true
      }
      return hasType
    },
    _renderTextDecoration: function (ctx, type) {
      if (!this[type] && !this.styleHas(type) && !this.checkAllParaStylesForTextDecoration(type)) {
        return;
      }
      var heightOfLine, size, _size,
        lineLeftOffset, dy, _dy,
        line, lastDecoration,
        leftOffset = this._getLeftOffset(),
        topOffset = this._getTopOffset(), top,
        boxStart, boxWidth, charBox, currentDecoration,
        maxHeight, currentFill, lastFill, path = this.path,
        charSpacing = this._getWidthOfCharSpacing(),
        offsetY = this.offsets[type];
      let cachedObjectTypeValue = this[type]

      for (var i = 0, len = this._textLines.length; i < len; i++) {
        // Foreach textline
        const currLineParaIndex = this.lineParaIndexes[i]
        const currParaStyle = this.getParaStyleByLine(i)
        const typeIsActiveOnCurrParaStyle = currParaStyle?.[type] === true
        heightOfLine = this.getHeightOfLine(i);
        if (!this[type] && !this.styleHas(type, i) && !typeIsActiveOnCurrParaStyle) {
          topOffset += heightOfLine;
          continue;
        }
        line = this._textLines[i];
        maxHeight = heightOfLine / this.lineHeight;
        lineLeftOffset = this._getLineLeftOffset(i);
        boxStart = 0;
        boxWidth = 0;

        if (typeIsActiveOnCurrParaStyle) {
          cachedObjectTypeValue = this[type]
          this[type] = true
        }

        lastDecoration = this.getValueOfPropertyAt(i, 0, type);
        lastFill = this.getValueOfPropertyAt(i, 0, 'fill');
        top = topOffset + maxHeight * (1 - this._fontSizeFraction);
        size = this.getHeightOfChar(i, 0);
        dy = this.getValueOfPropertyAt(i, 0, 'deltaY');
        for (var j = 0, jlen = line.length; j < jlen; j++) {
          // For each char in line
          charBox = this.__charBounds[i][j];
          currentDecoration = this.getValueOfPropertyAt(i, j, type);
          currentFill = this.getValueOfPropertyAt(i, j, 'fill');
          _size = this.getHeightOfChar(i, j);
          _dy = this.getValueOfPropertyAt(i, j, 'deltaY');
          if (path && currentDecoration && currentFill) { // TEXT ON PATH ONLY
            ctx.save();
            ctx.fillStyle = lastFill;
            ctx.translate(charBox.renderLeft, charBox.renderTop);
            ctx.rotate(charBox.angle);
            ctx.fillRect(
              -charBox.kernedWidth / 2,
              offsetY * _size + _dy,
              charBox.kernedWidth,
              this.fontSize / 15
            );
            ctx.restore();
          }
          else if (
            (currentDecoration !== lastDecoration || currentFill !== lastFill || _size !== size || _dy !== dy)
            && boxWidth > 0
          ) { // Something has changed since the last char
            var drawStart = leftOffset + lineLeftOffset + boxStart;
            if (this.direction === 'rtl') {
              drawStart = this.width - drawStart - boxWidth;
            }
            if (lastDecoration && lastFill) { // Because somethings changed we need to finish the current boxChain and draw it
              ctx.fillStyle = lastFill;
              console.log(`DEC FILL BECAUSE SOMETHING CHANGED, decDrawWidth: ${boxWidth}`)
              ctx.fillRect(
                drawStart,
                (top + offsetY * size + dy) + this.getTotalParaMarginUpToParaIndex(currLineParaIndex),
                boxWidth,
                this.fontSize / 15
              );
            }
            boxStart = charBox.left;
            boxWidth = charBox.width;
            lastDecoration = currentDecoration;
            lastFill = currentFill;
            size = _size;
            dy = _dy;
          }
          else {
            boxWidth += charBox.kernedWidth;
          }
        }
        var drawStart = leftOffset + lineLeftOffset + boxStart;
        if (this.direction === 'rtl') {
          drawStart = this.width - drawStart - boxWidth;
        }
        ctx.fillStyle = currentFill?.toLive?.(ctx) ?? currentFill
        console.log(`DEC FILL BECAUSE CURRENT DEC & CURRENT FILL: decdrawWidth: ${boxWidth - charSpacing}, currentFill: `, currentFill)
        currentDecoration && currentFill && ctx.fillRect(
          drawStart,
          (top + offsetY * size + dy) + this.getTotalParaMarginUpToParaIndex(currLineParaIndex),
          boxWidth - charSpacing,
          this.fontSize / 15
        );
        topOffset += heightOfLine;
        if (typeIsActiveOnCurrParaStyle) {
          this[type] = cachedObjectTypeValue
        }
      }
      // if there is text background color no
      // other shadows should be casted
      this._removeShadow(ctx);
    },
    getValueOfPropertyAt: function (lineIndex, charIndex, property) {
      var charStyle = this._getStyleDeclaration(lineIndex, charIndex);
      if (charStyle && typeof charStyle[property] !== 'undefined') {
        return charStyle[property]
      }
      const paraStyle = this.getParaStyleByLine(lineIndex)
      if (typeof paraStyle[property] !== 'undefined') {
        return paraStyle[property]
      }
      return this[property];
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

      const paraIndex = this.lineParaIndexes[lineIndex]
      const setParaStyleKey = this.pS[paraIndex]?.key
      const setOverrideParaFontSize = this.pS[paraIndex]?.fontSize
      if (setParaStyleKey) {
        const setFontSize = this.projectParaStylesController.paraStyles[setParaStyleKey].styles.fontSize
        charHeight = setFontSize
      }
      topOffset += (1 - this._fontSizeFraction) * this.getHeightOfLine(lineIndex) / this.lineHeight
        - charHeight * (1 - this._fontSizeFraction);

      // Compensate for paraMargins
      const cursorParaIndex = this.lineParaIndexes[lineIndex]
      topOffset += this.getTotalParaMarginUpToParaIndex(cursorParaIndex)

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
    getTotalParaMarginUpToParaIndex(upToParaIndex) {
      let totalParaMargin = 0
      // always add para0 topMargin
      const para0Style = this.getParaStyleByPara(0)
      totalParaMargin += para0Style.paraTopMargin
      let prevParaBottomMargin = para0Style.paraBottomMargin
      if (upToParaIndex > 0) {
        for (let i = 1; i <= upToParaIndex; i++) {
          const paraStyleObj = this.getParaStyleByPara(i)
          totalParaMargin += prevParaBottomMargin
          totalParaMargin += paraStyleObj.paraTopMargin
          prevParaBottomMargin = paraStyleObj.paraBottomMargin
        }
      }
      return totalParaMargin
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
        extraTop += this.getTotalParaMarginUpToParaIndex(this.lineParaIndexes[i])
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
                  top: (lineTopOffset + (this.getTotalParaMarginUpToParaIndex(this.lineParaIndexes[i]) * this.scaleY)),
                  width: boxWidth,
                  height: heightOfLine / this.lineHeight
                })
              }
              ctx.fillRect(
                drawStart,
                lineTopOffset + (this.getTotalParaMarginUpToParaIndex(this.lineParaIndexes[i])),
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
              top: (lineTopOffset + this.getTotalParaMarginUpToParaIndex(this.lineParaIndexes[i])) * this.scaleY,
              width: boxWidth,
              height: heightOfLine / this.lineHeight
            })
          }
          ctx.fillRect(
            drawStart,
            lineTopOffset + this.getTotalParaMarginUpToParaIndex(this.lineParaIndexes[i]),
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
      const useParaIndex = this.isWrapping
        ? this.currentWrappingParaIndex
        : this.lineParaIndexes[lineIndex]
      return this.getParaStyleByPara(useParaIndex)
    },
    getParaStyleByPara(useParaIndex) {
      const paraStyleObj = this.pS[useParaIndex]
      const hasSetParaStyleKey = paraStyleObj?.key || false
      const isDefault = (!hasSetParaStyleKey || hasSetParaStyleKey === this.defaultParaStyleKey || !this.projectParaStylesController.paraStyles?.[hasSetParaStyleKey]?.styles)
      const useParaStyleObj = !isDefault ? this.projectParaStylesController.paraStyles[hasSetParaStyleKey].styles : this.projectParaStylesController.paraStyles[this.defaultParaStyleKey].styles
      const useObjectOverrides = isDefault ? this.defaultParaStyleOverrides : {}
      const useUniqueParaOverrides = paraStyleObj?.overrides || {}
      const compiledParaStyles = { ...useParaStyleObj, ...useObjectOverrides, ...useUniqueParaOverrides }
      return compiledParaStyles
    },
    /**
     * @private
     * @param {Number} lineIndex index text line
     * @return {Number} Line left offset
     */
    _getLineLeftOffset: function (lineIndex) {
      var lineWidth = this.getLineWidth(lineIndex),
        lineDiff = this.width - lineWidth, direction = this.direction,
        isEndOfWrapping, leftOffset = 0, isEndOfWrapping = this.isEndOfWrapping(lineIndex);
      const textAlign = this.getParaStyleByLine(lineIndex)?.textAlign || this.textAlign

      if (textAlign === 'justify'
        || (textAlign === 'justify-center' && !isEndOfWrapping)
        || (textAlign === 'justify-right' && !isEndOfWrapping)
        || (textAlign === 'justify-left' && !isEndOfWrapping)
      ) {
        return 0;
      }
      if (textAlign === 'center') {
        leftOffset = lineDiff / 2;
      }
      if (textAlign === 'right') {
        leftOffset = lineDiff;
      }
      if (textAlign === 'justify-center') {
        leftOffset = lineDiff / 2;
      }
      if (textAlign === 'justify-right') {
        leftOffset = lineDiff;
      }
      if (direction === 'rtl') {
        leftOffset -= lineDiff;
      }
      return leftOffset;
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
    },
    getAnimatableValues() {
      const defaults = this.callSuper('getAnimatableValues')
      const stylesDeepCopy = JSON.parse(JSON.stringify(this.styles))
      // console.log('Fillable getAnimatableValues: ')
      return {
        ...defaults,
        styles: stylesDeepCopy
      }
    },
    getParaStyleSettingState(paraIndex) {
      const hasCustomSetKey = this.pS[paraIndex]?.key !== undefined
      const hasCustomOverrides = this.pS[paraIndex]?.overrides !== undefined

      if (!hasCustomSetKey && !hasCustomOverrides) {
        // If we don't have any custom set or customOverrides
        // let's return the info for the default style and overrides
        return {
          paraIndex,
          paraStyleKey: this.defaultParaStyleKey,
          hasOverrides: false,
          paraStyleStyles: this.projectParaStylesController.paraStyles[this.defaultParaStyleKey].styles,
          useStyleStyles: this.getFullDefaultParaStyleWithOverides().styles
        }
      }
      // If we have a custom set paraStyleKey or some custom overrides
      // return the info for the paraItself
      const useParaStyleKey = this.pS[paraIndex]?.key || this.defaultParaStyleKey
      const hasOverrides = this.pS[paraIndex]?.overrides

      const paraStyleStyles = this.projectParaStylesController.paraStyles[useParaStyleKey].styles
      let useStyleStyles = paraStyleStyles
      if (hasOverrides) {
        useStyleStyles = {
          ...paraStyleStyles,
          ...this.pS[paraIndex].overrides
        }
      }

      return {
        paraIndex,
        paraStyleKey: useParaStyleKey,
        hasOverrides,
        paraStyleStyles,
        useStyleStyles
      }
    },
    // vv ONLY NEEDED FOR EDITOR?? vv
    handleTextChanged: function () {
      // Update the paraStyles array with any paraChanges
      if (this._unwrappedTextLines.length > this.pS.length) {
        // New para has been added, clone the origin pS object for the new para
        const { lineIndex } = this.get2DCursorLocation(this.selectionStart)
        const originParaIndex = this.lineParaIndexes[lineIndex - 1]
        const originParaStyleObj = JSON.parse(JSON.stringify(this.pS[originParaIndex]))
        this.pS.splice(originParaIndex, 0, originParaStyleObj)
      }
      if (this._unwrappedTextLines.length < this.pS.length) {
        console.log('// Para removed')
        const { charIndex, lineIndex } = this.get2DCursorLocation(this.selectionStart)
        if (charIndex === 0) {
          console.log('Completely delete prev para')
          const originParaIndex = this.lineParaIndexes[lineIndex]
          this.pS.splice(originParaIndex, 1)
        } else {
          console.log('Combine with prev para')
          const originParaIndex = this.lineParaIndexes[lineIndex]
          this.pS.splice(originParaIndex + 1, 1)
        }
      }
    },
    /**
     * @returns {import('../../InspectorPane/ControlPanels/TextControlPanel').ActiveTextSelectionStyleSettings}
     */
    getActiveSelectionStyleSettings() {
      // WHOLE OBJECT
      if (!this.isEditing) {
        return this.returnObjectStyleValues()
      }
      const isRangeSelection = (this.selectionStart !== this.selectionEnd)
      // SINGLE CARRET
      if (!isRangeSelection) {
        const { lineIndex } = this.get2DCursorLocation()
        const paraIndex = this.lineParaIndexes[lineIndex]
        return {
          classType: 'singlePara',
          settingsName: 'Para style settings',
          ...this.getParaStyleSettingState(paraIndex)
        }
      }
      // We have a range selection
      const endLocation = this.get2DCursorLocation(this.selectionEnd)
      const endLine = this.textLines[endLocation.lineIndex]
      const startLocation = this.get2DCursorLocation()
      const rangeStartPara = this.lineParaIndexes[startLocation.lineIndex]
      const rangeEndPara = this.lineParaIndexes[endLocation.lineIndex]
      const startIsStartOfPara = startLocation.charIndex === 0
      const endIsEndOfPara = endLocation.charIndex === endLine.length
      const isSinglePara = rangeStartPara === rangeEndPara
      const isCompletePara = startIsStartOfPara && endIsEndOfPara
      if (isSinglePara && isCompletePara) {
        // 1 whole para selected
        return {
          classType: 'singlePara',
          settingsName: 'Para style settings',
          ...this.getParaStyleSettingState(rangeStartPara)
        }
      }
      if (isSinglePara && !isCompletePara) {
        // We have a sub-range of one para selected
        const paraStylesSettingsState = this.getParaStyleSettingState(rangeStartPara)
        const rangeSelectionStyles = this.getSelectionStyles()
        // Use the first char selection as our setStyles override
        const useStyleStyles = {
          ...paraStylesSettingsState.useStyleStyles,
          ...rangeSelectionStyles[0]
        }
        return {
          classType: 'singlePara',
          settingsName: 'Character style settings',
          ...paraStylesSettingsState,
          useStyleStyles
        }
      }

      // We have a range that includes multiple paras
      let selectedParaIndexes = []
      let activeParaStyles = new Set()
      let selectedOverrideObjects = []
      let someHaveOverrides = false
      let someDontHaveOverrides = false
      for (let i = rangeStartPara; i <= rangeEndPara; i++) {
        selectedParaIndexes.push(i)
        const useParaStyleKey = this.pS[i]?.key || this.defaultParaStyleKey
        activeParaStyles.add(useParaStyleKey)
        if (this.pS[i]?.overrides) {
          someHaveOverrides = true
          selectedOverrideObjects.push(this.pS[i].overrides)
        } else {
          someDontHaveOverrides = true
          selectedOverrideObjects.push(false)
        }
      }
      const selectedParaStyleKeysArray = [...activeParaStyles]
      // Now we can build a settings object based on our knowledge
      // of the selected elements

      if (selectedParaStyleKeysArray.length === 1) {
        // ONLY ONE PARA STYLE USED
        if (!someHaveOverrides && someDontHaveOverrides) {
          // NO OVERRIDES AT ALL
          return {
            classType: 'multiParas',
            settingsName: 'Para style settings',
            ...this.getParaStyleSettingState(rangeStartPara)
          }
        } else if (someHaveOverrides && someDontHaveOverrides) {
          // MIX OF OVERRIDES AND NOVERRIDES
          // Let's just show the styles for the parastyle for now
          return {
            classType: 'multiParas',
            settingsName: 'Para style settings',
            ...this.getParaStyleSettingState(rangeStartPara),
            hasOverrides: true
          }
        } else if (someHaveOverrides && !someDontHaveOverrides) {
          // EVERY SELECTED PARA HAS AN OVERRID
          // TODO: WE CAN CHECK IF THEY ALL MATCH AND DISPLAY THEM
          return {
            classType: 'multiParas',
            settingsName: 'Para style settings',
            ...this.getParaStyleSettingState(rangeStartPara),
            hasOverrides: true
          }
        }

        return {
          paraStyleDisplayValue: selectedParaStyleKeysArray[0],
          classType: 'multiParas',
          paraIndexes: selectedParaIndexes
        }
      } else {
        // We have multiple paras with different para styles
        return {
          paraStyleKey: 'Multiple',
          classType: 'multiParas',
          ...this.getParaStyleSettingState(rangeStartPara),
          paraIndexes: selectedParaIndexes
        }
      }
    },
    returnObjectStyleValues() {
      let useParaStyleKey = ''
      let allUsedParaStyles = new Set()
      this.pS.forEach(paraStyleObject => allUsedParaStyles.add(paraStyleObject?.key || this.defaultParaStyleKey))
      const allUsedParaStylesArray = [...allUsedParaStyles]
      if (allUsedParaStylesArray.length === 1 && allUsedParaStylesArray[0] === this.defaultParaStyleKey) {
        useParaStyleKey = this.defaultParaStyleKey
      } else {
        useParaStyleKey = `${this.getDefaultParaStyleDisplayName()} + multiple`
      }
      // Return the settings for the default paraStyle w/ default overrides
      const defaultParaStyleStyles = this.projectParaStylesController.paraStyles[this.defaultParaStyleKey].styles
      // if (Object.keys(this.defaultParaStyleOverrides).length) {
      //   paraStyleDisplayValue += ' *'
      // }
      const hasOverrides = Object.keys(this.defaultParaStyleOverrides).length ? this.defaultParaStyleOverrides : null
      const useStyleStyles = {
        ...defaultParaStyleStyles,
        ...this.defaultParaStyleOverrides
      }
      return {
        classType: 'object',
        settingsName: 'Para style settings',
        paraStyleKey: useParaStyleKey,
        useStyleStyles,
        hasOverrides,
        paraStyleStyles: defaultParaStyleStyles
      }
    },
    getFullDefaultParaStyleWithOverides() {
      const fullStyle = {
        ...this.projectParaStylesController.paraStyles[this.defaultParaStyleKey].styles,
        ...this.defaultParaStyleOverrides
      }
      return {
        ...this.projectParaStylesController.paraStyles,
        styles: fullStyle
      }
    },
    getDefaultParaStyleDisplayName() {
      return this.projectParaStylesController.paraStyles[this.defaultParaStyleKey].displayName
    },
    handleStyleChange(options) {
      console.log('🖌', options)
      // const defaultStyles = this.projectParaStylesController.paraStyles[this.defaultParaStyleKey].styles
      if (!this.isEditing) {
        // Style applied as override to default parastyle
        // Also applied as override to any set paras with setKey?
        console.log('🖌', 'object')
        // Apply overrides to default paraStyle settings
        this.applyOverrideToParaStyleObject({ key: this.defaultParaStyleKey, overrides: this.defaultParaStyleOverrides }, options)
        // Also because the default has changed set the values on this actual fabric object aswell
        this.set({
          ...this.projectParaStylesController.paraStyles[this.defaultParaStyleKey].styles,
          ...this.defaultParaStyleOverrides
        })
        // Also apply this override to every paraStyle
        this.pS.forEach((pSObj, i) => {
          this.applyOverrideToParaStyleObject(this.pS[i], options)
        })
        return this.handleStyleChanged()
      }
      const isRangeSelection = (this.selectionStart !== this.selectionEnd)
      const startLocation = this.get2DCursorLocation()
      if (!isRangeSelection) {
        console.log('🖌', 'SINGLE CARRET', options)
        // Apply overrides to the paraStyle of the para we're in
        const changeParaIndex = this.lineParaIndexes[startLocation.lineIndex]
        this.applyOverrideToParaStyleObject(this.pS[changeParaIndex], options)
        return this.handleStyleChanged()
      }
      // WE HAVE A RANGE SELECTION
      const endLocation = this.get2DCursorLocation(this.selectionEnd)
      const endLine = this.textLines[endLocation.lineIndex]
      const rangeStartPara = this.lineParaIndexes[startLocation.lineIndex]
      const rangeEndPara = this.lineParaIndexes[endLocation.lineIndex]
      const startIsStartOfPara = startLocation.charIndex === 0
      const endIsEndOfPara = endLocation.charIndex === endLine.length

      const isSinglePara = rangeStartPara === rangeEndPara
      const isCompletePara = startIsStartOfPara && endIsEndOfPara


      if (!isCompletePara && isSinglePara) {
        // Char range in single para // Set as Char styles
        this.smartApplyCharStyles(options)
        return this.handleStyleChanged()
      }
      if (!isCompletePara && !isSinglePara) {
        // Char range spanning multipl paras
        // On incomplete paras set as charStyles
        // But on completely selected paras set on pS.overrides
      }
      if (isSinglePara && isCompletePara) {
        // 1 whole para: Set as custom overrides on pS[currParaIndex]
        this.applyOverrideToParaStyleObject(this.pS[rangeStartPara], options, rangeStartPara)
        return this.handleStyleChanged()
      }
      if (!isSinglePara && isCompletePara) {
        // Multiple whole paras
        // Set as overides on every selected para and on the defaultParaStyleOverrides
      }
      return this.handleStyleChanged()
    },
    smartApplyCharStyles(newStyles, startCharIndex = null, endCharIndex = null) {
      startCharIndex = startCharIndex ?? this.selectionStart
      endCharIndex = endCharIndex ?? this.selectionEnd
      for (let i = startCharIndex; i < endCharIndex; i++) {
        const loc = this.get2DCursorLocation(i)
        if (!this._getLineStyle(loc.lineIndex)) {
          this._setLineStyle(loc.lineIndex);
        }

        if (!this._getStyleDeclaration(loc.lineIndex, loc.charIndex)) {
          this._setStyleDeclaration(loc.lineIndex, loc.charIndex, {})
        }

        const givenByParaStyle = this.getParaStyleByLine(loc.lineIndex)
        Object.entries(newStyles)
          .forEach(([key, newValue]) => {
            const newValueRemovesNeedForSetValue = givenByParaStyle[key] === newValue
            const shouldSetValueOnCharStyle = !newValueRemovesNeedForSetValue
            const shouldDeleteValueOnCharStyle = newValueRemovesNeedForSetValue && this.styles[loc.lineIndex]?.[loc.charIndex]?.[key] !== undefined
            if (shouldDeleteValueOnCharStyle) {
              delete this.styles[loc.lineIndex][loc.charIndex][key]
            }
            if (shouldSetValueOnCharStyle) {
              this.styles[loc.lineIndex][loc.charIndex] = this.styles[loc.lineIndex]?.[loc.charIndex] || {}
              this.styles[loc.lineIndex][loc.charIndex][key] = newValue
            }
          })
      }
    },
    applyOverrideToParaStyleObject(paraStyleObject, newOverrideObject, paraIndex = null) {
      // This function handles setting overrides on a pS object that already has a key availiable to check against
      // it also removes any now redundant charStyles
      const useParaStyleKey = paraStyleObject?.key || this.defaultParaStyleKey
      const stylesFromSetParaStyleKey = this.projectParaStylesController.paraStyles[useParaStyleKey].styles
      paraStyleObject.overrides = paraStyleObject?.overrides || {}
      Object.entries(newOverrideObject)
        .forEach(([key, newValue]) => {
          const valueOnParaStyle = stylesFromSetParaStyleKey[key]
          const hasValueOnOverride = paraStyleObject.overrides?.[key]
          const newSetRemovesOverride = valueOnParaStyle === newValue

          if (newSetRemovesOverride && hasValueOnOverride) {
            delete paraStyleObject.overrides[key]
          } else if (!newSetRemovesOverride) {
            paraStyleObject.overrides[key] = newValue
          }
          // If we have a paraIndex to work with and the currentKey is one which could exist on a charStyles object
          // then we should check for and remove any charStyle[key] refs that have the newly set override value
          if (paraIndex !== null) {
            if (key !== 'textAlign') {
              let paraLineIndexes = []
              this.lineParaIndexes.forEach((currParaIndex, lineIndex) => {
                if (currParaIndex === paraIndex) {
                  paraLineIndexes.push(lineIndex)
                }
              })
              paraLineIndexes.forEach(lineIndex => this.removeMatchingLineCharStyles(lineIndex, key, newValue))
            }
          }
          console.log(`applyOverrideToParaStyleObject> key: ${key}, newValue: ${newValue}, paraIndex: ${paraIndex}`)
        })
      const newOverridesHasKeys = paraStyleObject?.overrides ? Object.keys(paraStyleObject.overrides) : []
      if (!newOverridesHasKeys.length) {
        delete paraStyleObject?.overrides
      }
    },
    removeMatchingLineCharStyles(lineIndex, key, value) {
      if (!this.styles?.[lineIndex]) return
      Object.keys(this.styles[lineIndex])
        .forEach((charIndexString) => {
          if (this.styles[lineIndex][charIndexString]?.[key] === value) {
            delete this.styles[lineIndex][charIndexString][key]
          }
        })
    },
    handleStyleChanged() {
      this.dirty = true
      this.initDimensions()
      this.setCoords()
      return this.canvas.requestRenderAll()
    },
    /**
     * @param {String} newParaStyleKey 
     */
    handleChangeParaStyle(newParaStyleKey) {
      if (!this.isEditing) {
        // Set on whole object so obliterate all settings to this one
        this.defaultParaStyleKey = newParaStyleKey
        this.defaultParaStyleOverrides = {}
        this.pS = this.pS.map(_ => ({}))
        this.set(this.projectParaStylesController.paraStyles[newParaStyleKey].styles)
        return this.handleParaStylesArrayUpdated()
      }
      const isRangeSelection = (this.selectionStart !== this.selectionEnd)
      if (!isRangeSelection) {
        // No range means single carret in single para
        const { lineIndex } = this.get2DCursorLocation()
        const paraIndex = this.lineParaIndexes[lineIndex]
        this.pS[paraIndex] = { key: newParaStyleKey }
        return this.handleParaStylesArrayUpdated()
      }
      const rangeStartPara = this.lineParaIndexes[this.get2DCursorLocation().lineIndex]
      const rangeEndPara = this.lineParaIndexes[this.get2DCursorLocation(this.selectionEnd).lineIndex]
      if (rangeStartPara === rangeEndPara) {
        // We have a range within a single para
        this.pS[rangeStartPara] = { key: newParaStyleKey }
        return this.handleParaStylesArrayUpdated()
      }
      // We have a range that includes multiple paras
      // Just overwrite all of them?
      for (let i = rangeStartPara; i <= rangeEndPara; i++) {
        this.pS[i] = { key: newParaStyleKey }
      }
      return this.handleParaStylesArrayUpdated()
    },
    handleClearAllSetParaStyles() {
      this.pS = this.pS.map(_ => ({}))
      return this.handleParaStylesArrayUpdated()
    },
    handleClearAllCharacterStyles() {
      this.styles = {}
      return this.handleParaStylesArrayUpdated()
    },
    handleParaStylesArrayUpdated() {
      // Go thru and clean up any set to default keys
      this.pS.forEach((paraStyleObject, paraIndex) => {
        if (paraStyleObject.key === this.defaultParaStyleKey) {
          delete this.pS[paraIndex].key
        }
      })
      this.dirty = true
      this.initDimensions()
      this.setCoords()
      this?.hiddenTextarea?.focus()
      return this.canvas?.requestRenderAll()
    },
    /**
     * Returns object representation of an instance
     * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
     * @return {Object} Object representation of an instance
     */
    toObject: function (propertiesToInclude) {
      var additionalProps =
        ('fontFamily fontWeight fontSize text underline overline linethrough' +
          ' textAlign fontStyle lineHeight textBackgroundColor charSpacing styles' +
          ' direction path pathStartOffset pathSide pathAlign').split(' ');
      var allProperties = additionalProps.concat(propertiesToInclude);
      var obj = this.callSuper('toObject', allProperties);
      // styles will be overridden with a properly cloned structure
      obj.styles = fabric.util.object.clone(this.styles, true);
      // Add our custom attributes to the saveable object
      obj.pS = JSON.parse(JSON.stringify(this.pS))
      obj.defaultParaStyleKey = this.defaultParaStyleKey
      obj.defaultParaStyleOverrides = JSON.parse(JSON.stringify(this.defaultParaStyleOverrides))
      if (obj.path) {
        obj.path = this.path.toObject();
      }
      return obj;
    }
  })

  fabric.BodyTextbox.fromObject = function (object, callback) {
    return fabric.Object._fromObject('BodyTextbox', object, callback, 'text');
  }
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

const inAnimations = {
  'default': function (animationSettings) {
    console.log(`inAnimations: default`)
    // This is the Textbox instance
    const inTL = gsap.timeline({
      paused: true,
      onUpdate: this.canvas.requestRenderAll.bind(this.canvas)
    })
    inTL
      .fromTo(this, { opacity: 0 }, { opacity: 1, duration: 0.1 })
    return inTL
  }
}

export {
  BodyTextbox
}