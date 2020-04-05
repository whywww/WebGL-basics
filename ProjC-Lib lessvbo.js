/**
 * @Author Haoyu Wei
 * @Date 27 Nov 2019
 * @Note Project C - VBO box Lib
 */


 /** Global Variables */
var floatsPerVertex = 10; 
var isBlinn = 1;
var whichAttFunc = 0;

// Lights
var lamp0 = new LightsT();  // fixed light
var lamp1 = new LightsT();  // camera light
var lamp0On = 1;  // lamp 0 is on -> 1, otherwise 0.
var lamp1On = 1;  // lamp 1 is on -> 1, otherwise 0.

// Materials	
var matlSel = MATL_PEARL;
var matl = new Material(matlSel);

var amb = [0.2, 0.2, 0.2];
var dif = [1.0, 1.0, 1.0];
var spe = [1.0, 1.0, 1.0];
var dark = [0.0, 0.0, 0.0];  // light component off
lamp0.I_pos.elements.set([2.0, 1.0, 3.0]);
lamp0.I_ambi.elements.set(amb);
lamp0.I_diff.elements.set(dif);
lamp0.I_spec.elements.set(spe);

lamp1.I_pos.elements.set([-2.0, 1.0, 3.0]);  // not used, because it should be camera location
lamp1.I_ambi.elements.set(amb);
lamp1.I_diff.elements.set(dif);
lamp1.I_spec.elements.set(spe);

/****************** VBObox00 ***********************/
// Ground Grid
function VBObox00() {
    this.VERT_SRC =
    'precision highp float;\n' +
    'uniform mat4 u_ModelMat0;\n' +
    'attribute vec4 a_Pos0;\n' +
    'attribute vec3 a_Colr0;\n'+
    'varying vec3 v_Colr0;\n' +
    'void main() {\n' +
    '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
    '	 v_Colr0 = a_Colr0;\n' +
    ' }\n';
  
    this.FRAG_SRC = 
    'precision mediump float;\n' +
    'varying vec3 v_Colr0;\n' +
    'void main() {\n' +
    '  gl_FragColor = vec4(v_Colr0, 1.0);\n' + 
    '}\n';

    makeGroundGrid();
    makeAxis();
    var totalSize = gndVerts.length + axisVerts.length;
    var n = totalSize / 7;
    var vertices = new Float32Array(totalSize);

    gndStart = 0;
    for (i = 0, j = 0; j < gndVerts.length; i++, j++){
        vertices[i] = gndVerts[j];
    }
    axisStart = i;
    for(j = 0; j< axisVerts.length; i++, j++) {
		vertices[i] = axisVerts[j];
    }

    this.vboContents = vertices;
    this.vboVerts = n;
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    this.vboBytes = this.vboContents.length * this.FSIZE;
	this.vboStride = this.vboBytes / this.vboVerts; 

    this.vboFcount_a_Pos0 =  4;
    this.vboFcount_a_Colr0 = 3;
    console.assert((this.vboFcount_a_Pos0 + 
        this.vboFcount_a_Colr0) * 
        this.FSIZE == this.vboStride, 
        "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
    
    this.vboOffset_a_Pos0 = 0;
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;

    this.vboLoc;
    this.shaderLoc;	
    this.a_PosLoc;	
	this.a_ColrLoc;	
	this.ModelMat = new Matrix4();
    this.u_ModelMatLoc;	
}

VBObox00.prototype.init = function() {
    // a) Compile, link, upload shaders
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                                '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    gl.program = this.shaderLoc;
    
    // b) Create VBO on GPU, fill it
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
        console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);  // Specify purpose of the VBO
    gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);  

    // c) Find GPU locations for vars 
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;
    }
    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if(this.a_ColrLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;
    }

    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
    if (!this.u_ModelMatLoc) { 
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for u_ModelMat1 uniform');
        return;
    }

}

VBObox00.prototype.switchToMe = function() {
    gl.useProgram(this.shaderLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
    gl.vertexAttribPointer( this.a_PosLoc,
                            this.vboFcount_a_Pos0,
                            gl.FLOAT,
                            false,
                            this.vboStride,
                            this.vboOffset_a_Pos0 );	
    gl.vertexAttribPointer( this.a_ColrLoc, this.vboFcount_a_Colr0, 
                            gl.FLOAT, false, 
                            this.vboStride, this.vboOffset_a_Colr0 );
                                
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
}

VBObox00.prototype.adjust = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.adjust() call you needed to call this.switchToMe()!!');
    }
    var m = new Matrix4();
    m.setScale(0.5, 0.5, 0.5);
    this.ModelMat.set(vpMatrix).multiply(m);
    gl.uniformMatrix4fv(this.u_ModelMatLoc, false, this.ModelMat.elements);
}

VBObox00.prototype.draw = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.draw() call you needed to call this.switchToMe()!!');
    }
    gl.drawArrays(gl.LINES, 0, this.vboVerts); 
}

VBObox00.prototype.isReady = function() {
    var isOK = true;

    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
                            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

/****************** VBObox1 ***********************/
// Without light
function VBObox1() {
    this.VERT_SRC =
    'precision highp float;\n' +

    'attribute vec4 a_Pos0;\n' +
    'attribute vec3 a_Colr0;\n'+
    'attribute vec4 a_Normal;\n' +  // not used

    'uniform mat4 u_MvpMat;\n' +
    'uniform mat4 u_ModelMat;\n' +  // not used

    'varying vec4 v_Color;\n' +

    'void main() {\n' +
    '   vec4 noUse = u_ModelMat * a_Normal;\n' +
    '   gl_Position = u_MvpMat * a_Pos0 + 0.001 * noUse;\n' +
    '   v_Color = vec4(a_Colr0, 1.0);\n' + 
    ' }\n';
  
    this.FRAG_SRC = 
    'precision highp float;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '   gl_FragColor = v_Color;\n' + 
    '}\n';

    makeCube();  // upper body
    makeSphere();  // head
    makeSphere1();
    makeCylinder();  // legs
    makePyramid(); // pyramid
    var totalSize = cubeVerts.length + sphVerts.length + cylVerts.length + pyrVerts.length + sphVerts1.length;
    var n = totalSize / floatsPerVertex;
    var vertices = new Float32Array(totalSize);

    cubeStart = 0;
    for (i = 0, j = 0; j < cubeVerts.length; i++, j++){
        vertices[i] = cubeVerts[j];
    }
    sphStart = i;
    for (j = 0; j < sphVerts.length; i++, j++){
        vertices[i] = sphVerts[j];
    }
    sphStart1 = i;
    for (j = 0; j < sphVerts1.length; i++, j++){
        vertices[i] = sphVerts1[j];
    }
    cylStart = i;
    for (j = 0; j < cylVerts.length; i++, j++){
        vertices[i] = cylVerts[j];
    }
    pyrStart = i;
    for(j=0; j< pyrVerts.length; i++, j++) {
		vertices[i] = pyrVerts[j];
    }

    this.vboContents = vertices;
    this.vboVerts = n;  // 556
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  // 4
    this.vboBytes = this.vboContents.length * this.FSIZE;  // 22240
    this.vboStride = this.vboBytes / this.vboVerts;  // 40

    this.vboFcount_a_Pos0 =  4;
    this.vboFcount_a_Colr0 = 3;
    this.vboFcount_a_Norm0 = 3;
    console.assert((this.vboFcount_a_Pos0 + this.vboFcount_a_Colr0 + this.vboFcount_a_Norm0) * this.FSIZE == this.vboStride, 
        "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
    
    this.vboOffset_a_Pos0 = 0;
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;
    this.vboOffset_a_Norm0 = (this.vboFcount_a_Pos0 + this.vboFcount_a_Colr0) * this.FSIZE;

    this.vboLoc;
    this.shaderLoc;	
    this.a_PosLoc;	
    this.a_ColrLoc;	
    this.a_NormLoc;
    this.ModelMat = new Matrix4();
    this.u_ModelMatLoc;
    this.u_MvpMatLoc;	
}

VBObox1.prototype.init = function() {
    // a) Compile, link, upload shaders
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                                '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    gl.program = this.shaderLoc;
    
    // b) Create VBO on GPU, fill it
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
        console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);  // Specify purpose of the VBO
    gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);  

    // c) Find GPU locations for vars 
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;
    }

    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if(this.a_ColrLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;
    }
    this.a_NormLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() Failed to get GPU location of attribute a_Normal');
        return -1;
    }

    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat');
    this.u_MvpMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMat');
}

VBObox1.prototype.switchToMe = function() {
    gl.useProgram(this.shaderLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
    gl.vertexAttribPointer( this.a_PosLoc,
                            this.vboFcount_a_Pos0,
                            gl.FLOAT,
                            false,
                            this.vboStride,
                            this.vboOffset_a_Pos0 );                    	
    gl.vertexAttribPointer( this.a_ColrLoc, 
                            this.vboFcount_a_Colr0, 
                            gl.FLOAT, 
                            false, 
                            this.vboStride, 
                            this.vboOffset_a_Colr0 );
    gl.vertexAttribPointer( this.a_NormLoc,
                            this.vboFcount_a_Norm0,
                            gl.FLOAT,
                            false,
                            this.vboStride,
                            this.vboOffset_a_Norm0 ); 
                                
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
    gl.enableVertexAttribArray(this.a_NormLoc);
}

VBObox1.prototype.adjust = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.adjust() call you needed to call this.switchToMe()!!');
    }
}

VBObox1.prototype.draw = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.draw() call you needed to call this.switchToMe()!!');
    }
    // ModelMat is new Matrix now
    this.ModelMat.setTranslate(0.0,0.0,0.0);
    pushMatrix(this.ModelMat);
    drawTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // Draw Tree

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    drawLargeSphere(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // Draw Large Sphere

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    drawRobot(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);   // Draw robot 
    
    this.ModelMat = popMatrix(); 
    drawHelicopter(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // Draw Helicopter
}

VBObox1.prototype.isReady = function() {
    var isOK = true;

    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
                            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}


/****************** VBObox2 ***********************/
// Gouroud Shading with (Blinn) Phong Lighting
function VBObox2() {
    this.VERT_SRC =
    '#ifdef GL_ES\n' +
    'precision highp float;\n' +
    'precision highp int;\n' +
    '#endif\n' +
    'struct LampT0 {\n' +
    '   vec3 pos;\n' +	
    ' 	vec3 a;\n' +	
    ' 	vec3 d;\n' +	
    '	vec3 s;\n' +	
    '}; \n' +
    'struct MatlT {\n' +
	'	vec3 e;\n' +
	'	vec3 a;\n' +
	'	vec3 d;\n' +
	'	vec3 s;\n' +
	'	int se;\n' +
    '};\n' +
    'attribute vec4 a_Pos0;\n' +
    'attribute vec4 a_Normal;\n' +
    'attribute vec3 a_Colr0;\n'+ 

    'uniform int u_lamp0On;\n' +
    'uniform int u_lamp1On;\n' +
    'uniform int u_isBlinn;\n' +
    'uniform int u_whichAttFunc;\n' +

    'uniform mat4 u_NormalMatrix;\n' +
    'uniform mat4 u_ModelMat;\n' +
    'uniform mat4 u_MvpMat;\n' +

    'uniform MatlT u_MatlSet[1];\n' +  // Array of all materials
    'uniform LampT0 u_LampSet[2];\n' +  // Array of all lights
    'uniform vec4 u_eyePosWorld;\n' +  // Eye location in world coords

    'varying vec4 v_Color;\n' +  // line30

    'float attFunc(float dis, int whichAttFunc);\n' +  // declare a att function

    'void main() {\n' +
    '   vec3 ambient = vec3(0.0, 0.0, 0.0);\n' +
    '   vec3 diffuse = vec3(0.0, 0.0, 0.0);\n' +
    '   vec3 specular = vec3(0.0, 0.0, 0.0);\n' +
    '   vec3 emissive = vec3(0.0, 0.0, 0.0);\n' +
    '   float se0;\n' +

    '   gl_Position = u_MvpMat * a_Pos0;\n' +
    '   vec4 vertexPos = u_ModelMat * a_Pos0;\n' +  // Calculate world coord. of vertex
    '   vec3 eyeDirection = normalize(u_eyePosWorld.xyz - vertexPos.xyz); \n' + 
    '   vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +  // Calculate normal
    '   vec3 Kd0 = u_MatlSet[0].d * a_Colr0;\n' +  //line41
    '   if(u_lamp0On == 1){\n' +
    '       vec3 lightDirection0 = normalize(u_LampSet[0].pos - vertexPos.xyz);\n' +  // Calculate light direction
    '       float nDotL0 = max(dot(lightDirection0, normal), 0.0);\n' +  // lamp0 is from fixed direction
    '       float att0 = attFunc(distance(u_LampSet[0].pos, vertexPos.xyz), u_whichAttFunc);\n' +
    '       if (u_isBlinn > 0){\n' + 
    '           vec3 H0 = normalize(lightDirection0 + eyeDirection); \n' +
    '           float nDotH0 = max(dot(H0, normal), 0.0); \n' +
    '           se0 = pow(nDotH0, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       else {\n' +
    '           vec3 R0 = reflect(-lightDirection0, normal);\n' +
    '           float r0DotV = max(dot(R0, eyeDirection), 0.0);\n' +
    '           se0 = pow(r0DotV, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       ambient += u_LampSet[0].a * u_MatlSet[0].a;\n' +
    '       diffuse += u_LampSet[0].d * Kd0 * nDotL0 * att0;\n' +
    '	    specular += u_LampSet[0].s * u_MatlSet[0].s * se0 * att0;\n' +
    '       emissive += u_MatlSet[0].e;\n' +
    '   }\n' +
    '   if(u_lamp1On == 1){\n' +
    // Second Light is from Camera/Eye pos, so lightDirection is same as eyeDirection.
    '       float nDotL1 = max(dot(eyeDirection, normal), 0.0);\n' +  // lamp1 is from eye direction
    '       vec3 H1 = normalize(eyeDirection + eyeDirection); \n' +
    '       float nDotH1 = max(dot(H1, normal), 0.0); \n' +
    '       float se1 = pow(nDotH1, float(u_MatlSet[0].se));\n' +
    '       float att1 = attFunc(distance(u_eyePosWorld.xyz, vertexPos.xyz), u_whichAttFunc);\n' +
    '       ambient =  ambient + u_LampSet[1].a * u_MatlSet[0].a;\n' +
    '       diffuse += u_LampSet[1].d * Kd0 * nDotL1 * att1;\n' +
    '	    specular += u_LampSet[1].s * u_MatlSet[0].s * se1 * att1;\n' +
    '	    emissive += u_MatlSet[0].e;\n' +
    '   }\n' +
    '   v_Color = vec4(ambient + diffuse + specular + emissive, 1.0);\n' + 
    ' }\n' +
    'float attFunc(float dis, int whichAttFunc){\n' +
    '   if (whichAttFunc == 0){\n' +
    '       return 1.0;\n' +
    '   }\n' +
    '   if (whichAttFunc == 1){\n' +
    '       return 1.0/dis;\n' +
    '   }\n' +
    '   if (whichAttFunc == 2){\n' +
    '       return 1.0/pow(dis, 2.0);\n' +
    '   }\n' +
    '}\n';
  
    this.FRAG_SRC = 
    'precision highp float;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '   gl_FragColor = v_Color;\n' + 
    '}\n';

    makeCube();  // upper body
    makeSphere();  // head
    makeSphere1();
    makeCylinder();  // legs
    makePyramid(); // pyramid
    var totalSize = cubeVerts.length + sphVerts.length + cylVerts.length + pyrVerts.length + sphVerts1.length;
    var n = totalSize / floatsPerVertex;
    var vertices = new Float32Array(totalSize);

    cubeStart = 0;
    for (i = 0, j = 0; j < cubeVerts.length; i++, j++){
        vertices[i] = cubeVerts[j];
    }
    sphStart = i;
    for (j = 0; j < sphVerts.length; i++, j++){
        vertices[i] = sphVerts[j];
    }
    sphStart1 = i;
    for (j = 0; j < sphVerts1.length; i++, j++){
        vertices[i] = sphVerts1[j];
    }
    cylStart = i;
    for (j = 0; j < cylVerts.length; i++, j++){
        vertices[i] = cylVerts[j];
    }
    pyrStart = i;
    for(j=0; j< pyrVerts.length; i++, j++) {
		vertices[i] = pyrVerts[j];
    }

    this.vboContents = vertices;
    this.vboVerts = n;  // 556
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  // 4
    this.vboBytes = this.vboContents.length * this.FSIZE;  // 22240
    this.vboStride = this.vboBytes / this.vboVerts;  // 40

    this.vboFcount_a_Pos0 =  4;
    this.vboFcount_a_Colr0 = 3;
    this.vboFcount_a_Norm0 = 3;
    console.assert((this.vboFcount_a_Pos0 + this.vboFcount_a_Colr0 + this.vboFcount_a_Norm0) * this.FSIZE == this.vboStride, 
        "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
    
    this.vboOffset_a_Pos0 = 0;
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;
    this.vboOffset_a_Norm0 = (this.vboFcount_a_Pos0 + this.vboFcount_a_Colr0) * this.FSIZE;

    this.vboLoc;
    this.shaderLoc;	
    this.a_PosLoc;	
    this.a_ColrLoc;	
    this.a_NormLoc;
    this.ModelMat = new Matrix4();
    this.u_ModelMatLoc;
    this.u_MvpMatLoc;	
    this.u_NormalMatrix;
    this.u_eyePosWorld;

    this.u_Ka0;
    this.u_Ks0;
    this.u_Ke0;
    this.u_Kshiny0;

    this.lamp0 = new LightsT();
    this.lamp0.u_pos;
    this.lamp0.u_ambi;
    this.lamp0.u_diff;
    this.lamp0.u_spec;

    this.lamp1 = new LightsT();
    this.lamp1.u_pos;
    this.lamp1.u_ambi;
    this.lamp1.u_diff;
    this.lamp1.u_spec;
}

VBObox2.prototype.init = function() {
    // a) Compile, link, upload shaders
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                                '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    gl.program = this.shaderLoc;
    
    // b) Create VBO on GPU, fill it
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
        console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);  // Specify purpose of the VBO
    gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);  

    // c) Find GPU locations for vars 
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;
    }

    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if(this.a_ColrLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;
    }

    this.a_NormLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() Failed to get GPU location of attribute a_Normal');
        return -1;
    }

    this.u_lamp0On = gl.getUniformLocation(this.shaderLoc, 'u_lamp0On');
    this.u_lamp1On = gl.getUniformLocation(this.shaderLoc, 'u_lamp1On');
    if (!this.u_lamp0On || !this.u_lamp1On) { 
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp switches.');
        return;
    }
    this.u_isBlinn = gl.getUniformLocation(this.shaderLoc, 'u_isBlinn');
    this.u_whichAttFunc = gl.getUniformLocation(this.shaderLoc, 'u_whichAttFunc');

    this.u_eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat');
    this.u_MvpMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMat');
    this.u_NormalMatrix = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if (!this.u_MvpMatLoc || !this.u_NormalMatrix  || !this.u_eyePosWorld || !this.u_ModelMatLoc) { 
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for uniforms');
        return;
    }

    this.lamp0.u_pos = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos');
    this.lamp0.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].a');
    this.lamp0.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].d');
    this.lamp0.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].s');

    this.lamp1.u_pos = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].pos');
    this.lamp1.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].a');
    this.lamp1.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].d');
    this.lamp1.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].s');

    this.u_Ka0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].a');
    this.u_Kd0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].d');
    this.u_Ks0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].s');
    this.u_Ke0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].e');
	this.u_Kshiny0 = gl.getUniformLocation(gl.program, 'u_MatlSet[0].se');
    if(!this.lamp0.u_pos || !this.lamp0.u_ambi || !this.lamp0.u_diff || !this.lamp0.u_spec ) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp0.');
        return;
    }
    if(!this.lamp1.u_pos || !this.lamp1.u_ambi || !this.lamp1.u_diff || !this.lamp1.u_spec) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp1.');
        return;
    }
    if(!this.u_Ka0 || !this.u_Kd0 || !this.u_Ks0 || !this.u_Ke0) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for material0.');
        return;
    }
}

VBObox2.prototype.switchToMe = function() {
    gl.useProgram(this.shaderLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
    gl.vertexAttribPointer( this.a_PosLoc,
                            this.vboFcount_a_Pos0,
                            gl.FLOAT,
                            false,
                            this.vboStride,
                            this.vboOffset_a_Pos0 );                    	
    gl.vertexAttribPointer( this.a_ColrLoc, 
                            this.vboFcount_a_Colr0, 
                            gl.FLOAT, 
                            false, 
                            this.vboStride, 
                            this.vboOffset_a_Colr0 );
    gl.vertexAttribPointer( this.a_NormLoc,
                            this.vboFcount_a_Norm0,
                            gl.FLOAT,
                            false,
                            this.vboStride,
                            this.vboOffset_a_Norm0 );  
                                
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
    gl.enableVertexAttribArray(this.a_NormLoc);
}

VBObox2.prototype.adjust = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.adjust() call you needed to call this.switchToMe()!!');
    }

    gl.uniform4f(this.u_eyePosWorld, eyeX, eyeY, eyeZ, 1.0);

    gl.uniform3fv(this.lamp0.u_pos, lamp0.I_pos.elements.slice(0,3)); // Set the light direction (in the world coordinate)
    gl.uniform3fv(this.lamp0.u_ambi, lamp0.I_ambi.elements); 
    gl.uniform3fv(this.lamp0.u_diff, lamp0.I_diff.elements);
    gl.uniform3fv(this.lamp0.u_spec, lamp0.I_spec.elements);

    gl.uniform3fv(this.lamp1.u_pos, lamp1.I_pos.elements.slice(0,3)); // Set the light direction (in the world coordinate)
    gl.uniform3fv(this.lamp1.u_ambi, lamp1.I_ambi.elements); 
    gl.uniform3fv(this.lamp1.u_diff, lamp1.I_diff.elements);
    gl.uniform3fv(this.lamp1.u_spec, lamp1.I_spec.elements);

    gl.uniform3fv(this.u_Ke0, matl.K_emit.slice(0,3));
	gl.uniform3fv(this.u_Ka0, matl.K_ambi.slice(0,3));
    gl.uniform3fv(this.u_Kd0, matl.K_diff.slice(0,3));
    gl.uniform3fv(this.u_Ks0, matl.K_spec.slice(0,3));
    gl.uniform1i(this.u_Kshiny0, parseInt(matl.K_shiny));

    gl.uniform1i(this.u_lamp0On, lamp0On);
    gl.uniform1i(this.u_lamp1On, lamp1On);

    gl.uniform1i(this.u_isBlinn, isBlinn);
    gl.uniform1i(this.u_whichAttFunc, whichAttFunc);
}

VBObox2.prototype.draw = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.draw() call you needed to call this.switchToMe()!!');
    }
    // ModelMat is new Matrix now
    this.ModelMat.setTranslate(0.0,0.0,0.0);
    pushMatrix(this.ModelMat);
    drawTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // Draw Tree

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    drawLargeSphere(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // Draw Large Sphere

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    drawRobot(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);   // Draw robot 
    
    this.ModelMat = popMatrix(); 
    drawHelicopter(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // Draw Helicopter
}

VBObox2.prototype.isReady = function() {
    var isOK = true;

    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
                            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}


/****************** VBObox3 ***********************/
// Phong Shading with (Blinn) Phong Lighting
function VBObox3() {
    this.VERT_SRC =
    'precision highp float;\n' +
    'struct MatlT {\n' +
	'	vec3 e;\n' +
	'	vec3 a;\n' +
	'	vec3 d;\n' +
	'	vec3 s;\n' +
	'	int se;\n' +
    '};\n' +
    'attribute vec4 a_Pos0;\n' +
    'attribute vec4 a_Normal;\n' +
    'attribute vec3 a_Colr0;\n'+ 

    'uniform MatlT u_MatlSet[1];\n' +  // Array of all materials
    'uniform mat4 u_NormalMatrix;\n' +
    'uniform mat4 u_ModelMat;\n' +
    'uniform mat4 u_MvpMat;\n' +

    'varying vec3 v_Kd0;\n' +
    'varying vec3 v_Pos;\n' +
    'varying vec3 v_Normal;\n' +

    'void main() {\n' +
    '   gl_Position = u_MvpMat * a_Pos0;\n' +
    '   v_Pos = vec3(u_ModelMat * a_Pos0);\n' +  // Calculate world coord. of vertex
    '   v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +  // Calculate normal
    '   v_Kd0 = u_MatlSet[0].d * a_Colr0;\n' +
    ' }\n';
  
    this.FRAG_SRC = 
    '#ifdef GL_ES\n' +
    'precision highp float;\n' +
    'precision highp int;\n' +
    '#endif\n' +
    'struct LampT0 {\n' +
    '   vec3 pos;\n' +	
    ' 	vec3 a;\n' +	
    ' 	vec3 d;\n' +	
    '	vec3 s;\n' +	
    '}; \n' +
    'struct MatlT {\n' +
	'	vec3 e;\n' +
	'	vec3 a;\n' +
	'	vec3 d;\n' +
	'	vec3 s;\n' +
	'	int se;\n' +
    '};\n' +
    'uniform int u_lamp0On;\n' +
    'uniform int u_lamp1On;\n' +
    'uniform int u_isBlinn;\n' +
    'uniform int u_whichAttFunc;\n' +
    'uniform LampT0 u_LampSet[2];\n' +  // Array of all lights
    'uniform MatlT u_MatlSet[1];\n' +  // Array of all materials
    'uniform vec4 u_eyePosWorld;\n' +  // Eye location in world coords

    'varying vec3 v_Kd0;\n' +
    'varying vec3 v_Pos;\n' +
    'varying vec3 v_Normal;\n' +

    'float attFunc(float dis, int whichAttFunc);\n' +  // declare a att function

    'void main() {\n' +
    '   vec3 eyeDirection = normalize(u_eyePosWorld.xyz - v_Pos); \n' +
    '   vec3 normal = normalize(v_Normal);\n' +  // Normalized normal again
    '   vec3 ambient = vec3(0.0, 0.0, 0.0);\n' +
    '   vec3 diffuse = vec3(0.0, 0.0, 0.0);\n' +
    '   vec3 specular = vec3(0.0, 0.0, 0.0);\n' +
    '   vec3 emissive = vec3(0.0, 0.0, 0.0);\n' +
    '   float se0;\n' +

    '   if(u_lamp0On == 1){\n' +
    '       vec3 lightDirection0 = normalize(u_LampSet[0].pos - v_Pos);\n' +  // Calculate light direction
    '       float nDotL0 = max(dot(lightDirection0, normal), 0.0);\n' +  // lamp0 is from fixed direction
    '       float att0 = attFunc(distance(u_LampSet[0].pos, v_Pos), u_whichAttFunc);\n' +
    '       if (u_isBlinn > 0){\n' +  // Blinn
    '           vec3 H0 = normalize(lightDirection0 + eyeDirection); \n' +
    '           float nDotH0 = max(dot(H0, normal), 0.0); \n' +
    '           se0 = pow(nDotH0, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       else {\n' +  // Phong
    '           vec3 R0 = reflect(-lightDirection0, normal);\n' +
    '           float r0DotV = max(dot(R0, eyeDirection), 0.0);\n' +
    '           se0 = pow(r0DotV, float(u_MatlSet[0].se));\n' +
    '       }\n' +
    '       ambient += u_LampSet[0].a * u_MatlSet[0].a;\n' +
    '       diffuse += u_LampSet[0].d * v_Kd0 * nDotL0 * att0;\n' +
    '	    specular += u_LampSet[0].s * u_MatlSet[0].s * se0 * att0;\n' +
    '       emissive += u_MatlSet[0].e;\n' +
    '   }\n' +

    '   if(u_lamp1On == 1){\n' +  // Blinn
    // Second Light is from Camera/Eye pos, so lightDirection is same as eyeDirection.
    '       float nDotL1 = max(dot(eyeDirection, normal), 0.0);\n' +  // lamp1 is from eye direction
    '       vec3 H1 = normalize(eyeDirection + eyeDirection); \n' +
    '       float nDotH1 = max(dot(H1, normal), 0.0); \n' +
    '       float se1 = pow(nDotH1, float(u_MatlSet[0].se));\n' +
    '       float att1 = attFunc(distance(u_eyePosWorld.xyz, v_Pos), u_whichAttFunc);\n' +
    '       ambient =  ambient + u_LampSet[1].a * u_MatlSet[0].a;\n' +
    '       diffuse += u_LampSet[1].d * v_Kd0 * nDotL1 * att1;\n' +
    '	    specular += u_LampSet[1].s * u_MatlSet[0].s * se1 * att1;\n' +
    '	    emissive += u_MatlSet[0].e;\n' +
    '   }\n' +

    '   gl_FragColor = vec4(ambient + diffuse + specular + emissive, 1.0);\n' + 
    '}\n' +
    'float attFunc(float dis, int whichAttFunc){\n' +
    '   if (whichAttFunc == 0){\n' +
    '       return 1.0;\n' +
    '   }\n' +
    '   if (whichAttFunc == 1){\n' +
    '       return 1.0/dis;\n' +
    '   }\n' +
    '   if (whichAttFunc == 2){\n' +
    '       return 1.0/pow(dis, 2.0);\n' +
    '   }\n' +
    '}\n';

    makeCube();  // upper body
    makeSphere();  // head
    makeSphere1();
    makeCylinder();  // legs
    makePyramid(); // pyramid
    var totalSize = cubeVerts.length + sphVerts.length + cylVerts.length + pyrVerts.length + sphVerts1.length;
    var n = totalSize / floatsPerVertex;
    var vertices = new Float32Array(totalSize);

    cubeStart = 0;
    for (i = 0, j = 0; j < cubeVerts.length; i++, j++){
        vertices[i] = cubeVerts[j];
    }
    sphStart = i;
    for (j = 0; j < sphVerts.length; i++, j++){
        vertices[i] = sphVerts[j];
    }
    sphStart1 = i;
    for (j = 0; j < sphVerts1.length; i++, j++){
        vertices[i] = sphVerts1[j];
    }
    cylStart = i;
    for (j = 0; j < cylVerts.length; i++, j++){
        vertices[i] = cylVerts[j];
    }
    pyrStart = i;
    for(j=0; j< pyrVerts.length; i++, j++) {
		vertices[i] = pyrVerts[j];
    }

    this.vboContents = vertices;
    this.vboVerts = n;  // 556
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  // 4
    this.vboBytes = this.vboContents.length * this.FSIZE;  // 22240
    this.vboStride = this.vboBytes / this.vboVerts;  // 40

    this.vboFcount_a_Pos0 =  4;
    this.vboFcount_a_Colr0 = 3;
    this.vboFcount_a_Norm0 = 3;
    console.assert((this.vboFcount_a_Pos0 + this.vboFcount_a_Colr0 + this.vboFcount_a_Norm0) * this.FSIZE == this.vboStride, 
        "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");
    
    this.vboOffset_a_Pos0 = 0;
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;
    this.vboOffset_a_Norm0 = (this.vboFcount_a_Pos0 + this.vboFcount_a_Colr0) * this.FSIZE;

    this.vboLoc;
    this.shaderLoc;	
    this.a_PosLoc;	
    this.a_ColrLoc;	
    this.a_NormLoc;
    this.ModelMat = new Matrix4();
    this.u_ModelMatLoc;
    this.u_MvpMatLoc;	
    this.u_NormalMatrix;
    this.u_eyePosWorld;

    this.u_Ka0;
    this.u_Ks0;
    this.u_Ke0;
    this.u_Kshiny0;

    this.lamp0 = new LightsT();
    this.lamp0.u_pos;
    this.lamp0.u_ambi;
    this.lamp0.u_diff;
    this.lamp0.u_spec;

    this.lamp1 = new LightsT();
    this.lamp1.u_pos;
    this.lamp1.u_ambi;
    this.lamp1.u_diff;
    this.lamp1.u_spec;
}

VBObox3.prototype.init = function() {
    // a) Compile, link, upload shaders
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
        console.log(this.constructor.name + 
                                '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    gl.program = this.shaderLoc;
    
    // b) Create VBO on GPU, fill it
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
        console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
        return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);  // Specify purpose of the VBO
    gl.bufferData(gl.ARRAY_BUFFER, this.vboContents, gl.STATIC_DRAW);  

    // c) Find GPU locations for vars 
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if(this.a_PosLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;
    }

    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if(this.a_ColrLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;
    }

    this.a_NormLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_NormLoc < 0) {
        console.log(this.constructor.name + 
                              '.init() Failed to get GPU location of attribute a_Normal');
        return -1;
    }

    this.u_lamp0On = gl.getUniformLocation(this.shaderLoc, 'u_lamp0On');
    this.u_lamp1On = gl.getUniformLocation(this.shaderLoc, 'u_lamp1On');
    if (!this.u_lamp0On || !this.u_lamp1On) { 
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp switches.');
        return;
    }
    this.u_isBlinn = gl.getUniformLocation(this.shaderLoc, 'u_isBlinn');
    this.u_whichAttFunc = gl.getUniformLocation(this.shaderLoc, 'u_whichAttFunc');

    this.u_eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat');
    this.u_MvpMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMat');
    this.u_NormalMatrix = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if (!this.u_MvpMatLoc || !this.u_NormalMatrix  || !this.u_eyePosWorld || !this.u_ModelMatLoc) { 
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for uniforms');
        return;
    }

    this.lamp0.u_pos = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos');
    this.lamp0.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].a');
    this.lamp0.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].d');
    this.lamp0.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].s');

    this.lamp1.u_pos = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].pos');
    this.lamp1.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].a');
    this.lamp1.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].d');
    this.lamp1.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[1].s');

    this.u_Ka0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].a');
    this.u_Kd0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].d');
    this.u_Ks0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].s');
    this.u_Ke0 = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].e');
	this.u_Kshiny0 = gl.getUniformLocation(gl.program, 'u_MatlSet[0].se');
    if(!this.lamp0.u_pos || !this.lamp0.u_ambi || !this.lamp0.u_diff || !this.lamp0.u_spec ) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp0.');
        return;
    }
    if(!this.lamp1.u_pos || !this.lamp1.u_ambi || !this.lamp1.u_diff || !this.lamp1.u_spec) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for lamp1.');
        return;
    }
    if(!this.u_Ka0 || !this.u_Kd0 || !this.u_Ks0 || !this.u_Ke0) {
        console.log(this.constructor.name + 
                              '.init() failed to get GPU location for material0.');
        return;
    }

}

VBObox3.prototype.switchToMe = function() {
    gl.useProgram(this.shaderLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboLoc);
    gl.vertexAttribPointer( this.a_PosLoc,
                            this.vboFcount_a_Pos0,
                            gl.FLOAT,
                            false,
                            this.vboStride,
                            this.vboOffset_a_Pos0 );                    	
    gl.vertexAttribPointer( this.a_ColrLoc, 
                            this.vboFcount_a_Colr0, 
                            gl.FLOAT, 
                            false, 
                            this.vboStride, 
                            this.vboOffset_a_Colr0 );
    gl.vertexAttribPointer( this.a_NormLoc,
                            this.vboFcount_a_Norm0,
                            gl.FLOAT,
                            false,
                            this.vboStride,
                            this.vboOffset_a_Norm0 );  
                                
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
    gl.enableVertexAttribArray(this.a_NormLoc);
}

VBObox3.prototype.adjust = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.adjust() call you needed to call this.switchToMe()!!');
    }

    gl.uniform4f(this.u_eyePosWorld, eyeX, eyeY, eyeZ, 1.0);

    gl.uniform3fv(this.lamp0.u_pos, lamp0.I_pos.elements.slice(0,3)); // Set the light direction (in the world coordinate)
    gl.uniform3fv(this.lamp0.u_ambi, lamp0.I_ambi.elements); 
    gl.uniform3fv(this.lamp0.u_diff, lamp0.I_diff.elements);
    gl.uniform3fv(this.lamp0.u_spec, lamp0.I_spec.elements);

    gl.uniform3fv(this.lamp1.u_pos, lamp1.I_pos.elements.slice(0,3)); // Set the light direction (in the world coordinate)
    gl.uniform3fv(this.lamp1.u_ambi, lamp1.I_ambi.elements); 
    gl.uniform3fv(this.lamp1.u_diff, lamp1.I_diff.elements);
    gl.uniform3fv(this.lamp1.u_spec, lamp1.I_spec.elements);

    gl.uniform3fv(this.u_Ke0, matl.K_emit.slice(0,3));
	gl.uniform3fv(this.u_Ka0, matl.K_ambi.slice(0,3));
    gl.uniform3fv(this.u_Kd0, matl.K_diff.slice(0,3));
    gl.uniform3fv(this.u_Ks0, matl.K_spec.slice(0,3));
    gl.uniform1i(this.u_Kshiny0, parseInt(matl.K_shiny));

    gl.uniform1i(this.u_lamp0On, lamp0On);
    gl.uniform1i(this.u_lamp1On, lamp1On);

    gl.uniform1i(this.u_isBlinn, isBlinn);
    gl.uniform1i(this.u_whichAttFunc, whichAttFunc);
}

VBObox3.prototype.draw = function() {
    if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
                            '.draw() call you needed to call this.switchToMe()!!');
    }
    // ModelMat is new Matrix now
    this.ModelMat.setTranslate(0.0,0.0,0.0);
    pushMatrix(this.ModelMat);
    drawTree(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // Draw Tree

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    drawLargeSphere(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // Draw Large Sphere

    this.ModelMat = popMatrix();
    pushMatrix(this.ModelMat);
    drawRobot(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);   // Draw robot 
    
    this.ModelMat = popMatrix(); 
    drawHelicopter(this.ModelMat, this.u_ModelMatLoc, this.u_MvpMatLoc, this.u_NormalMatrix);  // Draw Helicopter
}

VBObox3.prototype.isReady = function() {
    var isOK = true;

    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
        console.log(this.constructor.name + 
                            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}



