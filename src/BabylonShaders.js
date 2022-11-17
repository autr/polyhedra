export const FresnelVertex =                "precision highp float;\r\n"+

                "// Attributes\r\n"+
                "attribute vec3 position;\r\n"+
                "attribute vec3 normal;\r\n"+

                "// Uniforms\r\n"+
                "uniform mat4 world;\r\n"+
                "uniform mat4 worldViewProjection;\r\n"+

                "// Varying\r\n"+
                "varying vec3 vPositionW;\r\n"+
                "varying vec3 vNormalW;\r\n"+

                "void main(void) {\r\n"+
                "    vec4 outPosition = worldViewProjection * vec4(position, 1.0);\r\n"+
                "    gl_Position = outPosition;\r\n"+
                "    \r\n"+
                "    vPositionW = vec3(world * vec4(position, 1.0));\r\n"+
                "    vNormalW = normalize(vec3(world * vec4(normal, 0.0)));\r\n"+
                "}\r\n"+
                "    \r\n";

export const FresnelFragment =                "precision highp float;\r\n"+

                "// Lights\r\n"+
                "varying vec3 vPositionW;\r\n"+
                "varying vec3 vNormalW;\r\n"+

                "// Refs\r\n"+
                "uniform vec3 cameraPosition;\r\n"+
                "uniform sampler2D textureSampler;\r\n"+

                "void main(void) {\r\n"+
                "    vec3 color = vec3(1., 1., 1.);\r\n"+
                "    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);\r\n"+

                "    // Fresnel\r\n"+
                "	float fresnelTerm = dot(viewDirectionW, vNormalW);\r\n"+
                "	fresnelTerm = clamp(1.0 - fresnelTerm, 0., 1.);\r\n"+

                "    gl_FragColor = vec4(color * fresnelTerm, 1.);\r\n"+
                "}\r\n";